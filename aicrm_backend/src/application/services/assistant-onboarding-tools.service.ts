import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { Conversation } from '../../domain/entities/conversation.entity';
import { ConversationState } from '../../domain/entities/conversation-state.entity';
import { Customer } from '../../domain/entities/customer.entity';
import { ExternalIdentity } from '../../domain/entities/external-identity.entity';
import { ConversationRepository } from '../../domain/ports/conversation.repository.port';
import { ConversationStateRepository } from '../../domain/ports/conversation-state.repository.port';
import { CustomerRepository } from '../../domain/ports/customer.repository.port';
import { ExternalIdentityRepository } from '../../domain/ports/external-identity.repository.port';
import { OnboardingProfileExtractorService } from './onboarding-profile-extractor.service';

export type OnboardingStep =
  | 'WAITING_NAME'
  | 'WAITING_EMAIL'
  | 'WAITING_DOCUMENT'
  | 'COMPLETED';

type IdentityStatus = 'new_user' | 'onboarding_pending' | 'registered';

@Injectable()
export class AssistantOnboardingToolsService {
  constructor(
    private readonly externalIdentityRepository: ExternalIdentityRepository,
    private readonly customerRepository: CustomerRepository,
    private readonly conversationRepository: ConversationRepository,
    private readonly conversationStateRepository: ConversationStateRepository,
    private readonly extractorService: OnboardingProfileExtractorService,
  ) {}

  async ASSISTANT_RESOLVE_USER_IDENTITY(input: {
    companyId: string;
    channel: 'whatsapp';
    externalUserId: string;
    phone: string | null;
  }): Promise<{
    status: IdentityStatus;
    customerExists: boolean;
    onboardingCompleted: boolean;
    onboardingStep: OnboardingStep;
    missingFields: string[];
    identity: ExternalIdentity;
    customer: Customer;
    conversation: Conversation;
    state: ConversationState | null;
  }> {
    const identity = await this.resolveIdentity(input);
    const customer = await this.resolveCustomer(identity, input);
    const conversation = await this.resolveConversation(customer, input.companyId);
    const state =
      await this.conversationStateRepository.findByConversationId(conversation.id);
    const onboardingStep = this.normalizeStep(customer.onboardingStep, state);
    const missingFields = this.calculateMissingFields(customer, onboardingStep);
    const onboardingCompleted = onboardingStep === 'COMPLETED';

    return {
      status: onboardingCompleted ? 'registered' : 'onboarding_pending',
      customerExists: Boolean(identity.customerId),
      onboardingCompleted,
      onboardingStep,
      missingFields,
      identity,
      customer,
      conversation,
      state,
    };
  }

  async ASSISTANT_START_ONBOARDING(input: {
    companyId: string;
    conversationId: string;
  }): Promise<ConversationState> {
    const existing = await this.conversationStateRepository.findByConversationId(
      input.conversationId,
    );
    if (existing) return existing;

    return this.conversationStateRepository.create(
      new ConversationState(
        uuidv4(),
        input.conversationId,
        input.companyId,
        'active',
        'WAITING_NAME',
        { missingFields: ['firstName', 'email', 'identificationNumber'] },
        new Date(),
        new Date(),
      ),
    );
  }

  async ASSISTANT_COLLECT_PROFILE_DATA(input: {
    message: string;
    customer: Customer;
    state: ConversationState;
    step: OnboardingStep;
  }): Promise<{
    customer: Customer;
    state: ConversationState;
    nextStep: OnboardingStep;
    completed: boolean;
    validationError: string | null;
  }> {
    let patch: Partial<Customer> = {};
    let validationError: string | null = null;

    if (input.step === 'WAITING_NAME') {
      const name = this.extractorService.validateName(input.message);
      if (!name.valid) {
        validationError = 'name';
      } else {
        patch = {
          firstName: name.firstName,
          fullName: name.fullName,
          name: name.fullName,
        };
      }
    }

    if (input.step === 'WAITING_EMAIL') {
      const email = this.extractorService.validateEmail(input.message);
      if (!email.valid) {
        validationError = 'email';
      } else {
        patch = { email: email.email };
      }
    }

    if (input.step === 'WAITING_DOCUMENT') {
      const doc = this.extractorService.validateDocument(input.message);
      if (!doc.provided) {
        validationError = 'document';
      } else if (doc.valid) {
        patch = { identificationNumber: doc.identificationNumber };
      } else {
        validationError = 'document';
      }
      if (doc.skipped) {
        patch = { identificationNumber: null };
      }
    }

    const merged = this.mergeCustomer(input.customer, patch);
    const nextStep = validationError
      ? input.step
      : this.computeNextStep(input.step, merged);
    const completed = nextStep === 'COMPLETED';
    const missingFields = this.calculateMissingFields(merged, nextStep);
    const completion = this.calculateCompletion(nextStep);

    const savedCustomer = await this.customerRepository.update(
      new Customer(
        merged.id,
        merged.name,
        merged.phone,
        merged.email,
        merged.companyId,
        merged.identificationType,
        merged.identificationNumber,
        merged.firstName,
        merged.lastName,
        merged.fullName,
        merged.address,
        merged.city,
        merged.age,
        merged.metadata,
        completed,
        nextStep,
        completion,
      ),
    );

    const savedState = await this.conversationStateRepository.update(
      new ConversationState(
        input.state.id,
        input.state.conversationId,
        input.state.companyId,
        input.state.status,
        nextStep,
        {
          missingFields,
          lastAskedStep: input.step,
          lastUpdatedStep: nextStep,
          validationError,
        },
        input.state.createdAt,
        new Date(),
      ),
    );

    return {
      customer: savedCustomer,
      state: savedState,
      nextStep,
      completed,
      validationError,
    };
  }

  ASSISTANT_GET_USER_PROFILE(customer: Customer): {
    summary: string;
    missingFields: string[];
    completion: number;
  } {
    const step = this.normalizeStep(customer.onboardingStep, null);
    return {
      summary: `Perfil de ${customer.fullName ?? customer.firstName ?? 'cliente'} (${customer.profileCompletionPercentage}%)`,
      missingFields: this.calculateMissingFields(customer, step),
      completion: customer.profileCompletionPercentage,
    };
  }

  isGreetingMessage(text: string): boolean {
    const cleaned = text.toLowerCase().replace(/[!¡?¿.,]/g, '').trim();
    return ['hola', 'buenas', 'buenos dias', 'buenas tardes', 'hi'].includes(
      cleaned,
    );
  }

  private computeNextStep(step: OnboardingStep, customer: Customer): OnboardingStep {
    if (step === 'WAITING_NAME') return 'WAITING_EMAIL';
    if (step === 'WAITING_EMAIL') return 'WAITING_DOCUMENT';
    if (step === 'WAITING_DOCUMENT') return 'COMPLETED';
    if (customer.firstName && customer.email) return 'WAITING_DOCUMENT';
    return 'WAITING_NAME';
  }

  private normalizeStep(
    customerStep: string | null,
    state: ConversationState | null,
  ): OnboardingStep {
    const source = (customerStep ?? state?.registrationStep ?? '').toUpperCase();
    if (source.includes('WAITING_EMAIL')) return 'WAITING_EMAIL';
    if (source.includes('WAITING_DOCUMENT')) return 'WAITING_DOCUMENT';
    if (source.includes('COMPLETED')) return 'COMPLETED';
    return 'WAITING_NAME';
  }

  private calculateMissingFields(
    customer: Customer,
    step: OnboardingStep,
  ): string[] {
    const missing: string[] = [];
    if (!customer.firstName) missing.push('firstName');
    if (!customer.email) missing.push('email');
    if (step !== 'COMPLETED' && step === 'WAITING_DOCUMENT')
      missing.push('identificationNumber');
    return missing;
  }

  private calculateCompletion(step: OnboardingStep): number {
    if (step === 'WAITING_NAME') return 20;
    if (step === 'WAITING_EMAIL') return 50;
    if (step === 'WAITING_DOCUMENT') return 80;
    return 100;
  }

  private mergeCustomer(customer: Customer, patch: Partial<Customer>): Customer {
    return new Customer(
      customer.id,
      patch.name ?? customer.name,
      customer.phone,
      patch.email ?? customer.email,
      customer.companyId,
      customer.identificationType,
      patch.identificationNumber ?? customer.identificationNumber,
      patch.firstName ?? customer.firstName,
      customer.lastName,
      patch.fullName ?? customer.fullName,
      customer.address,
      customer.city,
      customer.age,
      customer.metadata,
      customer.onboardingCompleted,
      customer.onboardingStep,
      customer.profileCompletionPercentage,
    );
  }

  private async resolveIdentity(input: {
    companyId: string;
    channel: 'whatsapp';
    externalUserId: string;
    phone: string | null;
  }): Promise<ExternalIdentity> {
    const existing =
      await this.externalIdentityRepository.findByChannelAndExternalUserId(
        input.companyId,
        input.channel,
        input.externalUserId,
      );
    if (existing) return existing;
    return this.externalIdentityRepository.create(
      new ExternalIdentity(
        uuidv4(),
        input.companyId,
        input.channel,
        input.externalUserId,
        input.phone,
        null,
        new Date(),
        new Date(),
      ),
    );
  }

  private async resolveCustomer(
    identity: ExternalIdentity,
    input: { companyId: string; externalUserId: string; phone: string | null },
  ): Promise<Customer> {
    if (identity.customerId) {
      const existing = await this.customerRepository.findById(identity.customerId);
      if (existing) return existing;
    }
    if (input.phone) {
      const byPhone = await this.customerRepository.findByPhone(
        input.phone,
        input.companyId,
      );
      if (byPhone) {
        await this.externalIdentityRepository.update(
          new ExternalIdentity(
            identity.id,
            identity.companyId,
            identity.channel,
            identity.externalUserId,
            input.phone,
            byPhone.id,
            identity.createdAt,
            new Date(),
          ),
        );
        return byPhone;
      }
    }

    const created = await this.customerRepository.create(
      new Customer(
        uuidv4(),
        null,
        input.phone ?? input.externalUserId,
        null,
        input.companyId,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        null,
        { source: 'whatsapp' },
        false,
        'WAITING_NAME',
        20,
      ),
    );
    await this.externalIdentityRepository.update(
      new ExternalIdentity(
        identity.id,
        identity.companyId,
        identity.channel,
        identity.externalUserId,
        input.phone,
        created.id,
        identity.createdAt,
        new Date(),
      ),
    );
    return created;
  }

  private async resolveConversation(
    customer: Customer,
    companyId: string,
  ): Promise<Conversation> {
    const latest = await this.conversationRepository.findLatestByCustomerId(
      customer.id,
      companyId,
    );
    if (latest) return latest;
    return this.conversationRepository.create(
      new Conversation(uuidv4(), customer.id, companyId, new Date()),
    );
  }
}
