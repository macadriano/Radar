import {
    Document,
    CriticalActivity,
    Incident,
    Risk,
    ProcessingStatus,
    TimeHorizon,
    IncidentCategory,
    DocumentType,
    UserRole
} from '../types/contractual';
import { requireDb, requireStorage } from './firebase';
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    serverTimestamp,
    query,
    where,
    getDocs
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { analyzeActivityRisk, analyzeIncidentRisk } from './riskEngine';
import { documentService } from './documentService';

/**
 * Servicio para el Pipeline de Procesamiento de Documentos
 */
export const documentProcessingService = {

    isValidFileType(file: File): boolean {
        const allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx'];
        const extension = file.name.split('.').pop()?.toLowerCase();

        const allowedMimeTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];

        return (extension !== undefined && allowedExtensions.includes(extension)) || allowedMimeTypes.includes(file.type);
    },

    /**
     * Sube un documento y dispara el pipeline de procesamiento
     * FIX: Crea el registro en Firestore ANTES de subir a Storage.
     */
    async uploadAndProcessDocument(
        projectId: string,
        file: File,
        author: string,
        useAI: boolean = false,
        explicitType: DocumentType,
        uploadedByUid: string = 'unknown',
        uploadedByRole: UserRole = 'LIDER_PROYECTO'
    ): Promise<string> {
        const db = requireDb();
        if (!this.isValidFileType(file)) {
            throw new Error('Formato no permitido. Solo se aceptan PDF, Word o Excel.');
        }

        // 1. Crear Registro Inmediato en Firestore para Trazabilidad
        const documentId = await documentService.createDocumentRecord({
            projectId,
            name: file.name,
            type: explicitType,
            uploadedByUid,
            uploadedByRole,
            fileName: file.name,
            mimeType: file.type || 'application/octet-stream',
            author
        });

        // 2. Proceso en Background (Subida + Pipeline)
        this.executeBackgroundPipeline(documentId, projectId, file, useAI).catch(err => {
            console.error("Error en Pipeline:", err);
            updateDoc(doc(db, 'documents', documentId), {
                status: 'ERROR',
                analysisStatus: 'FAILED'
            });
        });

        return documentId;
    },

    /**
     * Pipeline de Background: Storage -> Extracción -> Análisis
     */
    async executeBackgroundPipeline(docId: string, projectId: string, file: File, useAI: boolean) {
        const storage = requireStorage();
        let downloadUrl = '';
        let storagePath = `projects/${projectId}/documents/${Date.now()}_${file.name}`;

        try {
            // A) Subida a Storage
            const storageRef = ref(storage, storagePath);
            const snapshot = await uploadBytes(storageRef, file);
            downloadUrl = await getDownloadURL(snapshot.ref);

            // B) Actualizar Registro con URL
            await documentService.finalizeUpload(docId, downloadUrl, storagePath);

            // C) Procesar Contenido
            await this.processDocumentPipeline(docId, projectId, file, useAI);

        } catch (e) {
            console.error("Error en background pipeline:", e);
            throw e;
        }
    },

    async processDocumentPipeline(docId: string, projectId: string, file: File, useAI: boolean) {
        const db = requireDb();
        const docRef = doc(db, 'documents', docId);
        await updateDoc(docRef, { status: 'PROCESSING' });

        await new Promise(resolve => setTimeout(resolve, 2000));

        const extractedText = `Contenido extraído de ${file.name}. Actividades críticas identificadas. Posibles imprevistos logísticos.`;
        const findings = this.extractFindingsDeterministically(extractedText, projectId, docId);
        const risks = await this.convertFindingsToRisks(findings, projectId, docId);

        await updateDoc(docRef, {
            status: 'READY',
            processedDate: new Date().toISOString(),
            findingsCount: {
                activities: findings.activities.length,
                incidents: findings.incidents.length,
                risks: risks.length
            },
            extractedText: extractedText.substring(0, 500)
        });
    },

    extractFindingsDeterministically(text: string, projectId: string, docId: string) {
        const activities: CriticalActivity[] = [];
        const incidents: Incident[] = [];

        // Lógica mock-determinista
        if (text.toLowerCase().includes('actividad')) {
            activities.push({
                activityId: `ACT-${Date.now()}`,
                projectId,
                name: 'Actividad Extractada IA',
                plannedStart: '2026-03-01',
                plannedEnd: '2026-04-01',
                percentComplete: 0,
                criticalityBase: 3,
                linkedClauseIds: [],
                hasPenalty: false,
                penaltyWeight: 1
            });
        }

        return { activities, incidents };
    },

    async convertFindingsToRisks(findings: { activities: CriticalActivity[], incidents: Incident[] }, projectId: string, docId: string): Promise<string[]> {
        const db = requireDb();
        const riskIds: string[] = [];
        for (const act of findings.activities) {
            const risk = analyzeActivityRisk(act, 1);
            if (risk) {
                const ref = await addDoc(collection(db, 'risks'), risk);
                riskIds.push(ref.id);
            }
        }
        return riskIds;
    }
};
