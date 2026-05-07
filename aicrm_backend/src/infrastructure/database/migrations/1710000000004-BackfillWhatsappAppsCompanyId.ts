import { MigrationInterface, QueryRunner } from 'typeorm';

export class BackfillWhatsappAppsCompanyId1710000000004
  implements MigrationInterface
{
  name = 'BackfillWhatsappAppsCompanyId1710000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const companyCountRows = (await queryRunner.query(
      'SELECT COUNT(*) as total FROM companies',
    )) as Array<{ total: number | string }>;
    const companyCount = Number(companyCountRows[0]?.total ?? 0);

    // Backfill seguro solo cuando existe un unico tenant en la base.
    if (companyCount === 1) {
      const companyRows = (await queryRunner.query(
        'SELECT id FROM companies LIMIT 1',
      )) as Array<{ id: string }>;
      const singleCompanyId = companyRows[0]?.id;
      if (singleCompanyId) {
        await queryRunner.query(
          `
          UPDATE company_whatsapp_apps
          SET company_id = ?
          WHERE company_id IS NULL
          `,
          [singleCompanyId],
        );
      }
    }
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // No se revierte para evitar perder asociaciones validas ya corregidas.
  }
}
