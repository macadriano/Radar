import { PrismaClient, UserRole, UserStatus, ProjectStatus, DocumentType } from '@prisma/client';

const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
});

async function main() {
    console.log('🌱 Starting seed...');

    // 1. Create Admin User
    const admin = await prisma.usuario.upsert({
        where: { email: 'chbielich@tgi.pe' },
        update: {},
        create: {
            nombre: 'Christian Bielich',
            email: 'chbielich@tgi.pe',
            rol: UserRole.SUPERADMIN,
            estado: UserStatus.ACTIVE,
        },
    });

    const leader = await prisma.usuario.upsert({
        where: { email: 'lider@tgi.com.co' },
        update: {},
        create: {
            nombre: 'Responsable de Proyecto',
            email: 'lider@tgi.com.co',
            rol: UserRole.LIDER_PROYECTO,
            estado: UserStatus.ACTIVE,
        },
    });

    // 2. Create Sample Cliente
    const ecopetrol = await prisma.cliente.create({
        data: {
            razonSocial: 'Ecopetrol S.A.',
            rucNit: '899.999.068-1',
            contactoNombre: 'Gestión Contractual',
        },
    });

    // 3. Create Sample Unidad de Negocio
    const gerencia = await prisma.unidadNegocio.upsert({
        where: { liderId: admin.id },
        update: {},
        create: {
            nombre: 'Gerencia de Gasoductos',
            liderId: admin.id,
        },
    });

    // 4. Create Sample Project (Cusiana)
    const project = await prisma.proyecto.create({
        data: {
            codigo: 'CTR-CUS-2026-001',
            nombre: 'Sistema de Compresión Cusiana - Fase II',
            descripcion: 'Proyecto de expansión de capacidad de transporte.',
            estado: ProjectStatus.EN_EJECUCION,
            creadoPorId: admin.id,
            clienteId: ecopetrol.id,
            unidadId: gerencia.id,
            amount: 45850000,
            currency: 'USD',
            startDate: new Date('2026-02-01'),
            estimatedEndDate: new Date('2027-02-01'),
            leaderUid: leader.id, // Using existing leader
        },
    });

    // 5. Create Sample Document
    const mainContract = await prisma.documento.create({
        data: {
            proyectoId: project.id,
            tipo: DocumentType.CONTRATO,
            titulo: 'Contrato Principal - Cusiana II',
            fechaDocumento: new Date('2026-01-15'),
            archivoUrl: 'https://storage.radar.tgi/cusiana_main.pdf',
            storagePath: 'contracts/cusiana_main.pdf',
            hashArchivo: 'sha256:4f3b2a...',
            cargadoPorId: admin.id,
            estadoProcesamiento: 'LISTO',
        },
    });

    // 6. Create Obligacion & Riesgo
    const obligacion = await prisma.obligacion.create({
        data: {
            proyectoId: project.id,
            origenDocumentoId: mainContract.id,
            codigo: 'OBL-ING-001',
            descripcion: 'Entrega de ingeniería de detalle al 100%.',
            categoria: 'PLAZO',
            severidad: 'CRITICA',
            fechaCompromiso: new Date('2026-05-15'),
            estado: 'PENDIENTE',
        },
    });

    const risk = await prisma.riesgo.create({
        data: {
            proyectoId: project.id,
            obligacionId: obligacion.id,
            descripcion: 'Retraso Crítico en Ingeniería Nodo Cusiana',
            categoria: 'TECNICO',
            probabilidad: 4,
            impactoCronograma: 5,
            impactoCosto: 3,
            exposicionPenalidad: 4,
            severityScore: 35.5,
            status: 'MITIGANDO',
        },
    });

    console.log('✅ Seed finished successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
