import { AuthClient } from "@dfinity/auth-client";
import { ActorSubclass, HttpAgent } from "@dfinity/agent";
import { createActor, canisterId } from "@/declarations/chat_system_service";
import {
  _SERVICE,
  Chat,
  File,
  Folder,
  Message,
  ProjectVersion,
  Result,
  Result_1,
  Result_2,
  Result_3,
  Result_4,
  Result_5,
  Result_6,
  Result_7,
  Result_8,
  Result_9,
  Result_10,
  Result_11,
  Result_12,
  Result_13,
  Result_14,
  Result_15,
} from "@/declarations/chat_system_service/chat_system_service.did";
import { Principal } from "@dfinity/principal";

export class ChatSystemHandler {
  private authClient: AuthClient | null = null;
  private actor: ActorSubclass<_SERVICE> | null = null;
  private principal: Principal | null = null;
  private isInitialized: boolean = false;
  private readonly network: string = process.env.DFX_NETWORK || "local";
  private readonly identityProvider: string =
    this.network === "ic"
      ? "https://identity.ic0.app"
      : "http://rdmx6-jaaaa-aaaaa-aaadq-cai.localhost:4943";
  private readonly wslIp = "127.0.0.1";

  constructor() {
    this.initialize();
  }

  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      this.authClient = await AuthClient.create();
      const isAuthenticated = await this.authClient.isAuthenticated();

      if (isAuthenticated) {
        const identity = this.authClient.getIdentity();
        this.principal = identity.getPrincipal();
        const agent = new HttpAgent({
          host:
            this.network === "local"
              ? `http://${this.wslIp}:4943`
              : "https://ic0.app",
        });

        if (this.network === "local") {
          await agent.fetchRootKey().catch((err) => {
            console.warn("Unable to fetch root key for local replica:", err);
          });
        }

        this.actor = createActor(canisterId, {
          agentOptions: { identity, host: agent.host.toString() },
        });
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("ChatSystemHandler initialization failed:", error);
      throw new Error("Failed to initialize ChatSystemHandler");
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    if (!this.actor || !this.principal) {
      throw new Error(
        "Actor or principal not initialized. Please authenticate first."
      );
    }
  }

  // Chat Methods
  async createChat(title?: string): Promise<Result_3> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.createChat(
        this.principal!,
        title ? [title] : []
      );
      return result;
    } catch (error) {
      console.error("Create chat failed:", error);
      return { err: `Failed to create chat: ${(error as Error).message}` };
    }
  }

  async getChat(id: number): Promise<Result_8> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.getChat(id);
      return result;
    } catch (error) {
      console.error("Get chat failed:", error);
      return { err: `Failed to get chat: ${(error as Error).message}` };
    }
  }

  async getAllChatByUserId(userId: Principal): Promise<Result_13> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.getAllChatByUserId(userId);
      return result;
    } catch (error) {
      console.error("Get all chats by user ID failed:", error);
      return { err: `Failed to get chats: ${(error as Error).message}` };
    }
  }

  async updateChat(id: number, title?: string): Promise<Result_3> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.updateChat(id, title ? [title] : []);
      return result;
    } catch (error) {
      console.error("Update chat failed:", error);
      return { err: `Failed to update chat: ${(error as Error).message}` };
    }
  }

  async deleteChat(id: number): Promise<Result_14> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.deleteChat(id);
      return result;
    } catch (error) {
      console.error("Delete chat failed:", error);
      return { err: `Failed to delete chat: ${(error as Error).message}` };
    }
  }

  // File Methods
  async createFile(
    versionId: number,
    folderId: number,
    name: string,
    content: string
  ): Promise<Result_2> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.createFile(
        versionId,
        folderId ? [folderId] : [],
        name,
        content
      );
      return result;
    } catch (error) {
      console.error("Create file failed:", error);
      return { err: `Failed to create file: ${(error as Error).message}` };
    }
  }

  async getFile(id: number): Promise<Result_7> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.getFile(id);
      return result;
    } catch (error) {
      console.error("Get file failed:", error);
      return { err: `Failed to get file: ${(error as Error).message}` };
    }
  }

  async getAllFileByProjectVersionId(
    projectVersionId: number
  ): Promise<Result_12> {
    try {
      await this.ensureInitialized();
      const result =
        await this.actor!.getAllFileByProjectVersionId(projectVersionId);
      return result;
    } catch (error) {
      console.error("Get all files by project version ID failed:", error);
      return { err: `Failed to get files: ${(error as Error).message}` };
    }
  }

  async updateFile(
    id: number,
    folderId?: number,
    name?: string,
    content?: string
  ): Promise<Result_2> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.updateFile(
        id,
        folderId ? [folderId] : [],
        name ? [name] : [],
        content ? [content] : []
      );
      return result;
    } catch (error) {
      console.error("Update file failed:", error);
      return { err: `Failed to update file: ${(error as Error).message}` };
    }
  }

  async deleteFile(id: number): Promise<Result_14> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.deleteFile(id);
      return result;
    } catch (error) {
      console.error("Delete file failed:", error);
      return { err: `Failed to delete file: ${(error as Error).message}` };
    }
  }

  // Folder Methods
  async createFolder(
    versionId: number,
    name: string,
    parentId?: number
  ): Promise<Result_1> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.createFolder(
        versionId,
        name,
        parentId ? [parentId] : []
      );
      return result;
    } catch (error) {
      console.error("Create folder failed:", error);
      return { err: `Failed to create folder: ${(error as Error).message}` };
    }
  }

  async getFolder(id: number): Promise<Result_6> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.getFolder(id);
      return result;
    } catch (error) {
      console.error("Get folder failed:", error);
      return { err: `Failed to get folder: ${(error as Error).message}` };
    }
  }

  async getAllFolderByProjectVersionId(
    projectVersionId: number
  ): Promise<Result_11> {
    try {
      await this.ensureInitialized();
      const result =
        await this.actor!.getAllFolderByProjectVersionId(projectVersionId);
      return result;
    } catch (error) {
      console.error("Get all folders by project version ID failed:", error);
      return { err: `Failed to get folders: ${(error as Error).message}` };
    }
  }

  async updateFolder(
    id: number,
    name?: string,
    parentId?: number
  ): Promise<Result_1> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.updateFolder(
        id,
        name ? [name] : [],
        parentId ? [parentId] : []
      );
      return result;
    } catch (error) {
      console.error("Update folder failed:", error);
      return { err: `Failed to update folder: ${(error as Error).message}` };
    }
  }

  async deleteFolder(id: number): Promise<Result_14> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.deleteFolder(id);
      return result;
    } catch (error) {
      console.error("Delete folder failed:", error);
      return { err: `Failed to delete folder: ${(error as Error).message}` };
    }
  }

  // Message Methods
  async createMessage(
    chatId: number,
    sender: { user: null } | { ai: null },
    content: string,
    referencedVersion?: number
  ): Promise<Result> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.createMessage(
        chatId,
        sender,
        content,
        referencedVersion ? [referencedVersion] : []
      );
      return result;
    } catch (error) {
      console.error("Create message failed:", error);
      return { err: `Failed to create message: ${(error as Error).message}` };
    }
  }

  async getMessage(id: number): Promise<Result_5> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.getMessage(id);
      return result;
    } catch (error) {
      console.error("Get message failed:", error);
      return { err: `Failed to get message: ${(error as Error).message}` };
    }
  }

  async getAllMessageByChatId(chatId: number): Promise<Result_10> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.getAllMessageByChatId(chatId);
      return result;
    } catch (error) {
      console.error("Get all messages by chat ID failed:", error);
      return { err: `Failed to get messages: ${(error as Error).message}` };
    }
  }

  async updateMessage(id: number, content?: string): Promise<Result> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.updateMessage(
        id,
        content ? [content] : []
      );
      return result;
    } catch (error) {
      console.error("Update message failed:", error);
      return { err: `Failed to update message: ${(error as Error).message}` };
    }
  }

  async deleteMessage(id: number): Promise<Result_14> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.deleteMessage(id);
      return result;
    } catch (error) {
      console.error("Delete message failed:", error);
      return { err: `Failed to delete message: ${(error as Error).message}` };
    }
  }

  // Project Version Methods
  async createProjectVersion(
    chatId: number,
    versionNumber: number,
    snapshot: string
  ): Promise<Result_15> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.createProjectVersion(
        chatId,
        versionNumber,
        snapshot
      );
      return result;
    } catch (error) {
      console.error("Create project version failed:", error);
      return {
        err: `Failed to create project version: ${(error as Error).message}`,
      };
    }
  }

  async getProjectVersion(id: number): Promise<Result_4> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.getProjectVersion(id);
      return result;
    } catch (error) {
      console.error("Get project version failed:", error);
      return {
        err: `Failed to get project version: ${(error as Error).message}`,
      };
    }
  }

  async getAllProjectVersionByChatId(chatId: number): Promise<Result_9> {
    try {
      await this.ensureInitialized();
      const result = await this.actor!.getAllProjectVersionByChatId(chatId);
      return result;
    } catch (error) {
      console.error("Get all project versions by chat ID failed:", error);
      return {
        err: `Failed to get project versions: ${(error as Error).message}`,
      };
    }
  }
}
