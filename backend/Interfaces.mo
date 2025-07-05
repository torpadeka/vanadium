// src/backend/Interfaces.mo
import Types "./Types";
import Result "mo:base/Result";
import Principal "mo:base/Principal";

module {
  public type User = Types.User;
  public type Chat = Types.Chat;
  public type Message = Types.Message;
  public type ProjectVersion = Types.ProjectVersion;
  public type File = Types.File;
  public type Folder = Types.Folder;

  public type UserService = actor {
    createUser : (username : Text, email : Text) -> async Result.Result<User, Text>;
    getUser : (principal : Principal) -> async Result.Result<?User, Text>;
    updateUser : (username : ?Text, email : ?Text) -> async Result.Result<User, Text>;
    deleteUser : () -> async Result.Result<(), Text>;
  };

  public type ChatSystemService = actor {
    createChat : (userId : Text, title : ?Text) -> async Result.Result<Chat, Text>;
    getChat : (id : Nat32) -> async Result.Result<?Chat, Text>;
    getAllChatByUserId : (userId : Text) -> async Result.Result<[Chat], Text>;
    updateChat : (id : Nat32, title : ?Text) -> async Result.Result<Chat, Text>;
    deleteChat : (id : Nat32) -> async Result.Result<(), Text>;
    createMessage : (chatId : Nat32, sender : { #user; #ai }, content : Text, referencedVersion : ?Nat32) -> async Result.Result<Message, Text>;
    getMessage : (id : Nat32) -> async Result.Result<?Message, Text>;
    getAllMessageByChatId : (chatId : Nat32) -> async Result.Result<[Message], Text>;
    updateMessage : (id : Nat32, content : ?Text) -> async Result.Result<Message, Text>;
    deleteMessage : (id : Nat32) -> async Result.Result<(), Text>;
    createProjectVersion : (chatId : Nat32, versionNumber : Nat32, snapshot : Text) -> async Result.Result<ProjectVersion, Text>;
    getProjectVersion : (id : Nat32) -> async Result.Result<?ProjectVersion, Text>;
    getAllProjectVersionByChatId : (chatId : Nat32) -> async Result.Result<[ProjectVersion], Text>;
    createFile : (versionId : Nat32, folderId : ?Nat32, name : Text, content : Text) -> async Result.Result<File, Text>;
    getFile : (id : Nat32) -> async Result.Result<?File, Text>;
    getAllFileByProjectVersionId : (projectVersionId : Nat32) -> async Result.Result<[File], Text>;
    updateFile : (id : Nat32, folderId : ?Nat32, name : ?Text, content : ?Text) -> async Result.Result<File, Text>;
    deleteFile : (id : Nat32) -> async Result.Result<(), Text>;
    createFolder : (versionId : Nat32, name : Text, parentId : ?Nat32) -> async Result.Result<Folder, Text>;
    getFolder : (id : Nat32) -> async Result.Result<?Folder, Text>;
    getAllFolderByProjectVersionId : (projectVersionId : Nat32) -> async Result.Result<[Folder], Text>;
    updateFolder : (id : Nat32, name : ?Text, parentId : ?Nat32) -> async Result.Result<Folder, Text>;
    deleteFolder : (id : Nat32) -> async Result.Result<(), Text>;
  };
};