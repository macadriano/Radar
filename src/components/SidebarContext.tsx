"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SidebarContextType {
    isCollapsed: boolean
    toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [isCollapsed, setIsCollapsed] = useState(false)

    // Load state from localStorage
    useEffect(() => {
        const savedState = localStorage.getItem('sidebar-collapsed')
        if (savedState) {
            setIsCollapsed(savedState === 'true')
        }
    }, [])

    const toggleSidebar = () => {
        setIsCollapsed(prev => {
            const newState = !prev
            localStorage.setItem('sidebar-collapsed', String(newState))
            return newState
        })
    }

    return (
        <SidebarContext.Provider value={{ isCollapsed, toggleSidebar }}>
            {children}
        </SidebarContext.Provider>
    )
}

export const useSidebar = () => {
    const context = useContext(SidebarContext)
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider')
    }
    return context
}
