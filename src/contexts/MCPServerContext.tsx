import React, { createContext, useEffect, useState } from 'react';

export type MCPServerOption = {
    name: string;
    url: string;
};

export type MCPServerContextType = {
    selectedServer: MCPServerOption | null;
    setSelectedServer: React.Dispatch<React.SetStateAction<MCPServerOption | null>>;
};

const MCPServerContext = createContext<MCPServerContextType | undefined>(undefined);

export { MCPServerContext };

export default function MCPServerProvider({ children }: { children: React.ReactNode }) {
    const [selectedServer, setSelectedServer] = useState<MCPServerOption | null>(null);


    useEffect(() => {
        if (selectedServer) {
            console.log("Selected MCP Server:", selectedServer);
        }
    }, [selectedServer]);

    return (
        <MCPServerContext.Provider value={{ selectedServer, setSelectedServer }}>
            {children}
        </MCPServerContext.Provider>
    );
}
