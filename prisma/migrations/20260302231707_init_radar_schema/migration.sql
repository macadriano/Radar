-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPERADMIN', 'ADMIN', 'CONTROL_PROYECTOS', 'LIDER_PROYECTO', 'COLABORADOR', 'CLIENTE_LECTOR');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'PENDING', 'DISABLED');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('BORRADOR', 'EN_EJECUCION', 'CERRADO');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('CONTRATO', 'ALCANCE', 'INFORME', 'ACTA', 'OTRO');

-- CreateEnum
CREATE TYPE "FindingType" AS ENUM ('PARTE', 'CLAUSULA', 'MONTO', 'FECHA', 'PLAZO', 'HITO', 'PENALIDAD', 'ENTREGABLE', 'RIESGO', 'OTRO');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "rol" "UserRole" NOT NULL DEFAULT 'LIDER_PROYECTO',
    "estado" "UserStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UnidadNegocio" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "liderId" TEXT NOT NULL,

    CONSTRAINT "UnidadNegocio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "razonSocial" TEXT NOT NULL,
    "rucNit" TEXT,
    "contactoNombre" TEXT,
    "contactoEmail" TEXT,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proyecto" (
    "id" TEXT NOT NULL,
    "codigo" TEXT,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "estado" "ProjectStatus" NOT NULL DEFAULT 'BORRADOR',
    "creadoPorId" TEXT NOT NULL,
    "clienteId" TEXT,
    "unidadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proyecto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProyectoUsuario" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "rolEnProyecto" TEXT NOT NULL,
    "esResponsable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProyectoUsuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "tipo" "DocumentType" NOT NULL,
    "titulo" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "fechaDocumento" TIMESTAMP(3) NOT NULL,
    "archivoUrl" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "hashArchivo" TEXT NOT NULL,
    "cargadoPorId" TEXT NOT NULL,
    "estadoProcesamiento" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Extraccion" (
    "id" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "motor" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "estado" TEXT NOT NULL,
    "resumen" TEXT,
    "outputJsonPath" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Extraccion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntidadExtraida" (
    "id" TEXT NOT NULL,
    "extraccionId" TEXT NOT NULL,
    "tipo" "FindingType" NOT NULL,
    "label" TEXT NOT NULL,
    "valorTexto" TEXT NOT NULL,
    "valorNumero" DOUBLE PRECISION,
    "valorFecha" TIMESTAMP(3),
    "confianza" DOUBLE PRECISION NOT NULL,
    "fuenteFragmento" TEXT,

    CONSTRAINT "EntidadExtraida_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Obligacion" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "origenDocumentoId" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "severidad" TEXT NOT NULL,
    "fechaCompromiso" TIMESTAMP(3),
    "responsableId" TEXT,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Obligacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Riesgo" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "obligacionId" TEXT,
    "descripcion" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "probabilidad" INTEGER NOT NULL,
    "impactoCronograma" INTEGER NOT NULL,
    "impactoCosto" INTEGER NOT NULL,
    "exposicionPenalidad" INTEGER NOT NULL,
    "severityScore" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Riesgo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccionMitigacion" (
    "id" TEXT NOT NULL,
    "riesgoId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fechaCompromiso" TIMESTAMP(3) NOT NULL,
    "responsableId" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "comentarioCierre" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccionMitigacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvidenciaCumplimiento" (
    "id" TEXT NOT NULL,
    "obligacionId" TEXT NOT NULL,
    "documentoId" TEXT NOT NULL,
    "extraccionId" TEXT,
    "hallazgo" TEXT NOT NULL,
    "estadoEval" TEXT NOT NULL,
    "confianza" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvidenciaCumplimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alerta" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "obligacionId" TEXT,
    "tipo" TEXT NOT NULL,
    "nivel" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'ABIERTA',
    "generadaPor" TEXT NOT NULL DEFAULT 'SISTEMA',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cerradaAt" TIMESTAMP(3),

    CONSTRAINT "Alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ComentarioHallazgo" (
    "id" TEXT NOT NULL,
    "entidadTipo" TEXT NOT NULL,
    "entidadId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComentarioHallazgo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardMetrica" (
    "id" TEXT NOT NULL,
    "proyectoId" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valorNum" DOUBLE PRECISION NOT NULL,
    "valorText" TEXT,
    "fechaCorte" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DashboardMetrica_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_email_key" ON "Usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UnidadNegocio_liderId_key" ON "UnidadNegocio"("liderId");

-- CreateIndex
CREATE UNIQUE INDEX "Proyecto_codigo_key" ON "Proyecto"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "ProyectoUsuario_proyectoId_usuarioId_key" ON "ProyectoUsuario"("proyectoId", "usuarioId");

-- AddForeignKey
ALTER TABLE "UnidadNegocio" ADD CONSTRAINT "UnidadNegocio_liderId_fkey" FOREIGN KEY ("liderId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proyecto" ADD CONSTRAINT "Proyecto_unidadId_fkey" FOREIGN KEY ("unidadId") REFERENCES "UnidadNegocio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoUsuario" ADD CONSTRAINT "ProyectoUsuario_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProyectoUsuario" ADD CONSTRAINT "ProyectoUsuario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_cargadoPorId_fkey" FOREIGN KEY ("cargadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Extraccion" ADD CONSTRAINT "Extraccion_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "Documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EntidadExtraida" ADD CONSTRAINT "EntidadExtraida_extraccionId_fkey" FOREIGN KEY ("extraccionId") REFERENCES "Extraccion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obligacion" ADD CONSTRAINT "Obligacion_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Obligacion" ADD CONSTRAINT "Obligacion_origenDocumentoId_fkey" FOREIGN KEY ("origenDocumentoId") REFERENCES "Documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Riesgo" ADD CONSTRAINT "Riesgo_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Riesgo" ADD CONSTRAINT "Riesgo_obligacionId_fkey" FOREIGN KEY ("obligacionId") REFERENCES "Obligacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccionMitigacion" ADD CONSTRAINT "AccionMitigacion_riesgoId_fkey" FOREIGN KEY ("riesgoId") REFERENCES "Riesgo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccionMitigacion" ADD CONSTRAINT "AccionMitigacion_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenciaCumplimiento" ADD CONSTRAINT "EvidenciaCumplimiento_obligacionId_fkey" FOREIGN KEY ("obligacionId") REFERENCES "Obligacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenciaCumplimiento" ADD CONSTRAINT "EvidenciaCumplimiento_documentoId_fkey" FOREIGN KEY ("documentoId") REFERENCES "Documento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvidenciaCumplimiento" ADD CONSTRAINT "EvidenciaCumplimiento_extraccionId_fkey" FOREIGN KEY ("extraccionId") REFERENCES "Extraccion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_obligacionId_fkey" FOREIGN KEY ("obligacionId") REFERENCES "Obligacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComentarioHallazgo" ADD CONSTRAINT "ComentarioHallazgo_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardMetrica" ADD CONSTRAINT "DashboardMetrica_proyectoId_fkey" FOREIGN KEY ("proyectoId") REFERENCES "Proyecto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
