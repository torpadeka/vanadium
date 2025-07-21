import { FileNode } from "@/pages/Z9Page";
import systemPrompt from "./system-prompt.txt?raw";

interface AIMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export interface AIResponse {
    success: boolean;
    content?: string;
    error?: string;
    thinking?: string;
    actions?: { name: string; description: string }[];
    codeProject?: {
        id: string;
        files: { path: string; content: string; type?: string }[];
        edits?: { path: string; instructions: string }[];
        deleteFiles?: string[];
        moveFiles?: { from: string; to: string }[];
    };
}

export class AIService {
    private readonly endpoint = "/api/openai"; // Updated to use proxy
    private readonly systemPrompt = systemPrompt;

    private getSystemPrompt(fileTree?: FileNode[]): string {
        let prompt = this.systemPrompt;

        if (fileTree) {
            const srcStructure = this.getSrcFolderStructure(fileTree);
            if (srcStructure) {
                prompt += `\n\nCurrent file structure of the src folder:\n${srcStructure}`;
            }
        }

        return prompt;
    }

    private getSrcFolderStructure(nodes: FileNode[]): string | null {
        const srcNode = nodes.find(
            (n) => n.type === "folder" && n.name === "src" && !n.parentId
        );
        if (!srcNode || !srcNode.children) return null;

        const formatNode = (node: FileNode, indent = 0): string => {
            const prefix = "  ".repeat(indent);
            let result = `${prefix}${node.name} (${node.type})`;
            if (node.children) {
                node.children.forEach((child) => {
                    result += `\n${formatNode(child, indent + 1)}`;
                });
            }
            return result;
        };

        return formatNode(srcNode);
    }

    async sendMessage(
        userMessage: string,
        canvasData?: string | null,
        fileTree?: FileNode[]
    ): Promise<AIResponse> {
        try {
            const messages: AIMessage[] = [
                {
                    role: "system",
                    content: this.getSystemPrompt(fileTree),
                },
                {
                    role: "user",
                    content: canvasData
                        ? JSON.stringify({
                              "data:image/png;base64": canvasData.split(",")[1] // Extract base64 part
                          }) + `\nUser prompt: ${userMessage}`
                        : userMessage,
                },
            ];

            const response = await fetch(this.endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    messages,
                    max_tokens: 4000,
                    temperature: 0.7,
                    top_p: 0.95,
                    frequency_penalty: 0,
                    presence_penalty: 0,
                    model: "z9",
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    `API request failed: ${response.status} ${response.statusText}. ${
                        errorData.error?.message || ""
                    }`
                );
            }

            const data = await response.json();
            const content = data.choices[0].message.content;

            // Parse the response for tagged content
            const thinkingMatch = content.match(
                /<Thinking>([\s\S]*?)<\/Thinking>/
            );
            const actionsMatch = content.match(
                /<Actions>([\s\S]*?)<\/Actions>/
            );
            const codeProjectMatch = content.match(
                /<CodeProject id="([^"]+)">([\s\S]*?)<\/CodeProject>/
            );

            const result: AIResponse = { success: true, content };

            if (thinkingMatch) {
                result.thinking = thinkingMatch[1].trim();
            }

            if (actionsMatch) {
                const actionItems = actionsMatch[1].match(
                    /<Action name="([^"]+)" description="([^"]+)"/g
                );
                if (actionItems) {
                    result.actions = actionItems.map(
                        (item: {
                            match: (arg0: RegExp) => [any, any, any];
                        }) => {
                            const [, name, description] = item.match(
                                /<Action name="([^"]+)" description="([^"]+)"/
                            )!;
                            return { name, description };
                        }
                    );
                }
            }

            if (codeProjectMatch) {
                const [, id, projectContent] = codeProjectMatch;
                const files: {
                    path: string;
                    content: string;
                    type?: string;
                }[] = [];
                const edits: { path: string; instructions: string }[] = [];
                const deleteFiles: string[] = [];
                const moveFiles: { from: string; to: string }[] = [];

                // Extract files
                const fileMatches = projectContent.match(
                    /```(?:[a-z]+)? file="([^"]+)"(?: type="([^"]+)")?\s*\n([\s\S]*?)```/g
                );
                if (fileMatches) {
                    fileMatches.forEach(
                        (match: {
                            match: (arg0: RegExp) => [any, any, any, any];
                        }) => {
                            const [, path, type, content] = match.match(
                                /```(?:[a-z]+)? file="([^"]+)"(?: type="([^"]+)")?\s*\n([\s\S]*?)```/
                            )!;
                            files.push({ path, content: content.trim(), type });
                        }
                    );
                }

                // Extract quick edits
                const editMatches = projectContent.match(
                    /<QuickEdit>\s*```(?:[a-z]+)? file="([^"]+)"\s*\n([\s\S]*?)```\s*<\/QuickEdit>/g
                );
                if (editMatches) {
                    editMatches.forEach(
                        (match: {
                            match: (arg0: RegExp) => [any, any, any];
                        }) => {
                            const [, path, instructions] = match.match(
                                /<QuickEdit>\s*```(?:[a-z]+)? file="([^"]+)"\s*\n([\s\S]*?)```\s*<\/QuickEdit>/
                            )!;
                            edits.push({
                                path,
                                instructions: instructions.trim(),
                            });
                        }
                    );
                }

                // Extract delete files
                const deleteMatches = projectContent.match(
                    /<DeleteFile\s+file="([^"]+)"/g
                );
                if (deleteMatches) {
                    deleteFiles.push(
                        ...deleteMatches.map(
                            (match: string) =>
                                match.match(/<DeleteFile\s+file="([^"]+)"/)![1]
                        )
                    );
                }

                // Extract move files
                const moveMatches = projectContent.match(
                    /<MoveFile\s+from="([^"]+)"\s+to="([^"]+)"/g
                );
                if (moveMatches) {
                    moveFiles.push(
                        ...moveMatches.map(
                            (match: {
                                match: (arg0: RegExp) => [any, any, any];
                            }) => {
                                const [, from, to] = match.match(
                                    /<MoveFile\s+from="([^"]+)"\s+to="([^"]+)"/
                                )!;
                                return { from, to };
                            }
                        )
                    );
                }

                if (
                    files.length > 0 ||
                    edits.length > 0 ||
                    deleteFiles.length > 0 ||
                    moveFiles.length > 0
                ) {
                    result.codeProject = {
                        id,
                        files,
                        edits,
                        deleteFiles,
                        moveFiles,
                    };
                }
            }

            return result;
        } catch (error) {
            console.error("AI Service Error:", error);
            return {
                success: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Unknown error occurred",
            };
        }
    }
}