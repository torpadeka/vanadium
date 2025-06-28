import Types "./Types";
import Result "mo:base/Result";

module {
  public type User = Types.User;
  public type Chat = Types.Chat;
  public type Message = Types.Message;
  public type ProjectVersion = Types.ProjectVersion;
  public type File = Types.File;
  public type Folder = Types.Folder;

  public type UserService = actor {
    createUser : shared (username : Text, email : Text) -> async Result.Result<User, Text>;
    getUser : shared (id : Nat32) -> async Result.Result<?User, Text>;
    updateUser : shared (id : Nat32, username : ?Text, email : ?Text) -> async Result.Result<User, Text>;
    deleteUser : shared (id : Nat32) -> async Result.Result<(), Text>;
  };

  public type ChatService = actor {
    createChat : shared (userId : Nat32, title : ?Text) -> async Result.Result<Chat, Text>;
    getChat : shared (id : Nat32) -> async Result.Result<?Chat, Text>;
    updateChat : shared (id : Nat32, title : ?Text) -> async Result.Result<Chat, Text>;
    deleteChat : shared (id : Nat32) -> async Result.Result<(), Text>;
  };

  public type MessageService = actor {
    createMessage : shared (chatId : Nat32, sender : { #user; #ai }, content : Text, referencedVersion : ?Nat32) -> async Result.Result<Message, Text>;
    getMessage : shared (id : Nat32) -> async Result.Result<?Message, Text>;
    updateMessage : shared (id : Nat32, content : ?Text, referencedVersion : ?Nat32) -> async Result.Result<Message, Text>;
    deleteMessage : shared (id : Nat32) -> async Result.Result<(), Text>;
  };

  public type ProjectVersionService = actor {
    createProjectVersion : shared (chatId : Nat32, versionNumber : Nat32, snapshot : Text) -> async Result.Result<ProjectVersion, Text>;
    getProjectVersion : shared (id : Nat32) -> async Result.Result<?ProjectVersion, Text>;
    updateProjectVersion : shared (id : Nat32, snapshot : ?Text) -> async Result.Result<ProjectVersion, Text>;
    deleteProjectVersion : shared (id : Nat32) -> async Result.Result<(), Text>;
  };

  public type FileService = actor {
    createFile : shared (versionId : Nat32, folderId : ?Nat32, name : Text, content : Text) -> async Result.Result<File, Text>;
    getFile : shared (id : Nat32) -> async Result.Result<?File, Text>;
    updateFile : shared (id : Nat32, content : ?Text) -> async Result.Result<File, Text>;
    deleteFile : shared (id : Nat32) -> async Result.Result<(), Text>;
  };

  public type FolderService = actor {
    createFolder : shared (versionId : Nat32, name : Text, parentId : ?Nat32) -> async Result.Result<Folder, Text>;
    getFolder : shared (id : Nat32) -> async Result.Result<?Folder, Text>;
    updateFolder : shared (id : Nat32, name : ?Text) -> async Result.Result<Folder, Text>;
    deleteFolder : shared (id : Nat32) -> async Result.Result<(), Text>;
  };
};