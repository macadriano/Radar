"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { Project, ProjectStatus } from '../types/contractual';
import { projectService } from '../lib/projectService';
import { useAuth } from './AuthContext';

interface ProjectContextType {
    projects: Project[];
    activeProjects: Project[];
    allProjectsCount: number;
    isLoading: boolean;
    refreshProjects: () => Promise<void>;
    createProject: (project: Omit<Project, 'id'>) => Promise<string>;
    updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
    assignLeader: (projectId: string, leaderUid: string, previousLeaderUid?: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider = ({ children }: { children: ReactNode }) => {
    const { profile } = useAuth();
    const [rawProjects, setRawProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const isAdmin = profile?.role === 'SUPERADMIN' || profile?.role === 'ADMIN' || profile?.role === 'CONTROL_PROYECTOS';

    useEffect(() => {
        if (!profile) return;

        // Suscripción con filtrado por rol en el servicio (RBAC Real)
        const unsubscribe = projectService.subscribeToProjects(
            (updatedProjects) => {
                setRawProjects(updatedProjects);
                setIsLoading(false);
            },
            profile.role,
            profile.uid
        );

        return () => unsubscribe();
    }, [profile]);

    const projects = useMemo(() => {
        if (!profile) return [];
        // Ya vienen filtrados desde el servicio si es LIDER_PROYECTO
        return rawProjects;
    }, [rawProjects, profile]);

    const activeProjects = useMemo(() =>
        projects.filter(p => p.status === 'EN_PLANIFICACION' || p.status === 'EN_EJECUCION'),
        [projects]);

    const refreshProjects = async () => {
        setIsLoading(true);
        try {
            const all = profile?.role === 'LIDER_PROYECTO'
                ? await projectService.getProjectsByLeader(profile.uid)
                : await projectService.getAllProjects();
            setRawProjects(all);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const createProject = async (project: Omit<Project, 'id'>) => {
        return await projectService.createProject(project);
    };

    const updateProject = async (id: string, updates: Partial<Project>) => {
        return await projectService.updateProject(id, updates);
    };

    const assignLeader = async (projectId: string, leaderUid: string, previousLeaderUid?: string) => {
        return await projectService.assignLeader(projectId, leaderUid, previousLeaderUid);
    };

    return (
        <ProjectContext.Provider value={{
            projects,
            activeProjects,
            allProjectsCount: rawProjects.length,
            isLoading,
            refreshProjects,
            createProject,
            updateProject,
            assignLeader
        }}>
            {children}
        </ProjectContext.Provider>
    );
};

export const useProjects = () => {
    const context = useContext(ProjectContext);
    if (context === undefined) {
        throw new Error('useProjects must be used within a ProjectProvider');
    }
    return context;
};
