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
import {
  ExtractedProfileData,
  OnboardingProfileExtractorService,
} from './onboarding-profile-extractor.service';

type IdentityStatus =
  | 'new_user'
  | 'onboarding_pending'
  | 'registered'
  | 'profile_incomplete';

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
    onboardingStep: string;
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

    const status = this.resolveStatus(customer, state);
    const profile = this.ASSISTANT_GET_USER_PROFILE(customer);
    return {
      status,
      customerExists: Boolean(identity.customerId),
      onboardingCompleted: customer.onboardingCompleted || status === 'registered',
      onboardingStep: customer.onboardingStep ?? 'awaiting_firstName',
      missingFields: profile.missingFields,
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
    if (existing) {
      return existing;
    }

    return this.conversationStateRepository.create(
      new ConversationState(
        uuidv4(),
        input.conversationId,
        input.companyId,
        'active',
        'awaiting_name',
        { missingFields: this.getDefaultMissingFields(), collectedFields: [] },
        new Date(),
        new Date(),
      ),
    );
  }

  async ASSISTANT_COLLECT_PROFILE_DATA(input: {
    message: string;
    customer: Customer;
    state: ConversationState;
  }): Promise<{
    customer: Customer;
    state: ConversationState;
    extracted: ExtractedProfileData;
    nextField: string | null;
    completion: number;
  }> {
    const extracted = this.extractorService.extract(input.message, {
      allowLooseNameDetection: input.customer.onboardingStep === 'awaiting_firstName',
    });
    const merged = this.mergeCustomer(input.customer, extracted);
    const completion = this.calculateCompletion(merged);
    const nextField = this.resolveNextField(merged);

    const updatedCustomer = await this.customerRepository.update(
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
        completion >= 70,
        nextField ? `awaiting_${nextField}` : 'completed',
        completion,
      ),
    );

    const missingFields = this.getDefaultMissingFields().filter((field) =>
      this.isFieldMissing(updatedCustomer, field),
    );

    const updatedState = await this.conversationStateRepository.update(
      new ConversationState(
        input.state.id,
        input.state.conversationId,
        input.state.companyId,
        input.state.status,
        nextField ? `awaiting_${nextField}` : 'completed',
        {
          missingFields,
          lastExtracted: extracted,
        },
        input.state.createdAt,
        new Date(),
      ),
    );

    return {
      customer: updatedCustomer,
      state: updatedState,
      extracted,
      nextField,
      completion,
    };
  }

  async ASSISTANT_REGISTER_USER(input: {
    customer: Customer;
    state: ConversationState;
  }): Promise<{ customer: Customer; state: ConversationState }> {
    const completion = this.calculateCompletion(input.customer);
    const savedCustomer = await this.customerRepository.update(
      new Customer(
        input.customer.id,
        input.customer.name,
        input.customer.phone,
        input.customer.email,
        input.customer.companyId,
        input.customer.identificationType,
        input.customer.identificationNumber,
        input.customer.firstName,
        input.customer.lastName,
        input.customer.fullName,
        input.customer.address,
        input.customer.city,
        input.customer.age,
        input.customer.metadata,
        true,
        'completed',
        completion,
      ),
    );

    const savedState = await this.conversationStateRepository.update(
      new ConversationState(
        input.state.id,
        input.state.conversationId,
        input.state.companyId,
        'active',
        'completed',
        input.state.context,
        input.state.createdAt,
        new Date(),
      ),
    );

    return { customer: savedCustomer, state: savedState };
  }

  ASSISTANT_GET_USER_PROFILE(customer: Customer): {
    summary: string;
    missingFields: string[];
    completion: number;
  } {
    const missingFields = this.getDefaultMissingFields().filter((field) =>
      this.isFieldMissing(customer, field),
    );
    return {
      summary: `Perfil de ${customer.fullName ?? customer.firstName ?? 'cliente'} con ${customer.profileCompletionPercentage}% completado`,
      missingFields,
      completion: customer.profileCompletionPercentage,
    };
  }

  isGreetingMessage(text: string): boolean {
    const cleaned = text.toLowerCase().replace(/[!¡?¿.,]/g, '').trim();
    return [
      'hola',
      'buenas',
      'buenos dias',
      'buenas tardes',
      'buenas noches',
      'hello',
      'hi',
    ].includes(cleaned);
  }

  async ASSISTANT_UPDATE_USER_PROFILE(input: {
    customer: Customer;
    patch: Partial<ExtractedProfileData>;
  }): Promise<Customer> {
    const merged = this.mergeCustomer(input.customer, input.patch);
    const completion = this.calculateCompletion(merged);
    return this.customerRepository.update(
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
        completion >= 70,
        completion >= 70 ? 'completed' : merged.onboardingStep,
        completion,
      ),
    );
  }

  private resolveStatus(
    customer: Customer,
    state: ConversationState | null,
  ): IdentityStatus {
    if (!state) return 'new_user';
    if (state.registrationStep !== 'completed') return 'onboarding_pending';
    if (customer.profileCompletionPercentage < 70) return 'profile_incomplete';
    return 'registered';
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
      if (byPhone) return byPhone;
    }
    const placeholder = await this.customerRepository.create(
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
        'awaiting_first_name',
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
        placeholder.id,
        identity.createdAt,
        new Date(),
      ),
    );
    return placeholder;
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

  private mergeCustomer(customer: Customer, data: Partial<ExtractedProfileData>): Customer {
    const firstName = data.firstName ?? customer.firstName;
    const lastName = data.lastName ?? customer.lastName;
    const fullName =
      data.fullName ??
      customer.fullName ??
      ([firstName, lastName].filter(Boolean).join(' ').trim() || null);
    const name = customer.name ?? fullName ?? firstName ?? null;

    return new Customer(
      customer.id,
      name,
      customer.phone,
      data.email ?? customer.email,
      customer.companyId,
      customer.identificationType,
      data.identificationNumber ?? customer.identificationNumber,
      firstName ?? null,
      lastName ?? null,
      fullName || null,
      data.address ?? customer.address,
      data.city ?? customer.city,
      data.age ?? customer.age,
      customer.metadata,
      customer.onboardingCompleted,
      customer.onboardingStep,
      customer.profileCompletionPercentage,
    );
  }

  private getDefaultMissingFields(): string[] {
    return [
      'firstName',
      'lastName',
      'email',
      'identificationNumber',
      'city',
      'address',
    ];
  }

  private isFieldMissing(customer: Customer, field: string): boolean {
    const value = (customer as unknown as Record<string, unknown>)[field];
    return value === null || value === undefined || value === '';
  }

  private resolveNextField(customer: Customer): string | null {
    return this.getDefaultMissingFields().find((field) =>
      this.isFieldMissing(customer, field),
    ) ?? null;
  }

  private calculateCompletion(customer: Customer): number {
    const fields = this.getDefaultMissingFields();
    const done = fields.filter((field) => !this.isFieldMissing(customer, field)).length;
    return Math.min(100, Math.round((done / fields.length) * 100));
  }
}
