const baseURL=import.meta.env.VITE_DATABASE_BE_URL
const fetchMCPServers=async()=>{
    try {
        const response = await fetch(`${baseURL}/api/mcp/servers`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching MCP servers:', error);
        throw error;
    }
}

const connectToMCP=async(url:string)=>{
    try {
        const result = await fetch(`${baseURL}/api/mcp/connect`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url }),
        });
        const data = await result.json();
        if(data.success){
            return {
                success: true,
            };
        }
        return {
            success: false,
            error: data.error
        }
    } catch (error:any) {
        return {
            success: false,
            error: error.message
        }
    }
}

export { fetchMCPServers,connectToMCP }