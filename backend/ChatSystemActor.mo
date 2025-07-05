import HashMap "mo:base/HashMap";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Nat32 "mo:base/Nat32";
import Principal "mo:base/Principal";
import Option "mo:base/Option";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Types "./Types";

actor ChatSystemActor {
  // State for Chats
  let chats = HashMap.HashMap<Nat32, Types.Chat>(0, Nat32.equal, func(x : Nat32) : Nat32 { x });
  var nextChatId : Nat32 = 0;

  // State for Files
  let files = HashMap.HashMap<Nat32, Types.File>(0, Nat32.equal, func(x : Nat32) : Nat32 { x });
  var nextFileId : Nat32 = 0;

  // State for Folders
  let folders = HashMap.HashMap<Nat32, Types.Folder>(0, Nat32.equal, func(x : Nat32) : Nat32 { x });
  var nextFolderId : Nat32 = 0;

  // State for Messages
  let messages = HashMap.HashMap<Nat32, Types.Message>(0, Nat32.equal, func(x : Nat32) : Nat32 { x });
  var nextMessageId : Nat32 = 0;

  // State for Project Versions
  let projectVersions = HashMap.HashMap<Nat32, Types.ProjectVersion>(0, Nat32.equal, func(x : Nat32) : Nat32 { x });
  var nextProjectVersionId : Nat32 = 0;

  // Chat Functions
  public shared func createChat(userId : Principal, title : ?Text) : async Result.Result<Types.Chat, Text> {
    let chat : Types.Chat = {
      id = nextChatId;
      userId = userId;
      title = title;
      createdAt = Time.now();
    };
    chats.put(nextChatId, chat);
    nextChatId += 1;
    #ok(chat);
  };

  public shared func getChat(id : Nat32) : async Result.Result<?Types.Chat, Text> {
    switch (chats.get(id)) {
      case (?chat) #ok(?chat);
      case null #ok(null);
    };
  };

  public shared query func getAllChatByUserId(userId : Principal) : async Result.Result<[Types.Chat], Text> {
    let userChats = Iter.toArray(
      Iter.filter(chats.entries(), func ((_, chat) : (Nat32, Types.Chat)) : Bool { chat.userId == userId })
    );
    #ok(Array.map(userChats, func ((_, chat) : (Nat32, Types.Chat)) : Types.Chat { chat }));
  };

  public shared func updateChat(id : Nat32, title : ?Text) : async Result.Result<Types.Chat, Text> {
    switch (chats.get(id)) {
      case (?chat) {
        let updatedChat : Types.Chat = {
          id = chat.id;
          userId = chat.userId;
          title = title;
          createdAt = chat.createdAt;
        };
        chats.put(id, updatedChat);
        #ok(updatedChat);
      };
      case null #err("Chat not found");
    };
  };

  public shared func deleteChat(id : Nat32) : async Result.Result<(), Text> {
    switch (chats.get(id)) {
      case (?_) {
        chats.delete(id);
        #ok();
      };
      case null #err("Chat not found");
    };
  };

  // File Functions
  public shared func createFile(versionId : Nat32, folderId : ?Nat32, name : Text, content : Text) : async Result.Result<Types.File, Text> {
    if (name == "" or content == "") {
      return #err("Name and content are required");
    };
    let file : Types.File = {
      id = nextFileId;
      versionId = versionId;
      folderId = folderId;
      name = name;
      content = content;
      createdAt = Time.now();
    };
    files.put(nextFileId, file);
    nextFileId += 1;
    #ok(file);
  };

  public shared func getFile(id : Nat32) : async Result.Result<?Types.File, Text> {
    switch (files.get(id)) {
      case (?file) #ok(?file);
      case null #ok(null);
    };
  };

  public shared query func getAllFileByProjectVersionId(projectVersionId : Nat32) : async Result.Result<[Types.File], Text> {
    let versionFiles = Iter.toArray(
      Iter.filter(files.entries(), func ((_, file) : (Nat32, Types.File)) : Bool { file.versionId == projectVersionId })
    );
    #ok(Array.map(versionFiles, func ((_, file) : (Nat32, Types.File)) : Types.File { file }));
  };

  public shared func updateFile(id : Nat32, folderId : ?Nat32, name : ?Text, content : ?Text) : async Result.Result<Types.File, Text> {
    switch (files.get(id)) {
      case (?file) {
        let updatedFile : Types.File = {
          id = file.id;
          versionId = file.versionId;
          folderId = folderId;
          name = Option.get(name, file.name);
          content = Option.get(content, file.content);
          createdAt = file.createdAt;
        };
        files.put(id, updatedFile);
        #ok(updatedFile);
      };
      case null #err("File not found");
    };
  };

  public shared func deleteFile(id : Nat32) : async Result.Result<(), Text> {
    switch (files.get(id)) {
      case (?_) {
        files.delete(id);
        #ok();
      };
      case null #err("File not found");
    };
  };

  // Folder Functions
  public shared func createFolder(versionId : Nat32, name : Text, parentId : ?Nat32) : async Result.Result<Types.Folder, Text> {
    if (name == "") {
      return #err("Name is required");
    };
    let folder : Types.Folder = {
      id = nextFolderId;
      versionId = versionId;
      name = name;
      parentId = parentId;
      createdAt = Time.now();
    };
    folders.put(nextFolderId, folder);
    nextFolderId += 1;
    #ok(folder);
  };

  public shared func getFolder(id : Nat32) : async Result.Result<?Types.Folder, Text> {
    switch (folders.get(id)) {
      case (?folder) #ok(?folder);
      case null #ok(null);
    };
  };

  public shared query func getAllFolderByProjectVersionId(projectVersionId : Nat32) : async Result.Result<[Types.Folder], Text> {
    let versionFolders = Iter.toArray(
      Iter.filter(folders.entries(), func ((_, folder) : (Nat32, Types.Folder)) : Bool { folder.versionId == projectVersionId })
    );
    #ok(Array.map(versionFolders, func ((_, folder) : (Nat32, Types.Folder)) : Types.Folder { folder }));
  };

  public shared func updateFolder(id : Nat32, name : ?Text, parentId : ?Nat32) : async Result.Result<Types.Folder, Text> {
    switch (folders.get(id)) {
      case (?folder) {
        let updatedFolder : Types.Folder = {
          id = folder.id;
          versionId = folder.versionId;
          name = Option.get(name, folder.name);
          parentId = parentId;
          createdAt = folder.createdAt;
        };
        folders.put(id, updatedFolder);
        #ok(updatedFolder);
      };
      case null #err("Folder not found");
    };
  };

  public shared func deleteFolder(id : Nat32) : async Result.Result<(), Text> {
    switch (folders.get(id)) {
      case (?_) {
        folders.delete(id);
        #ok();
      };
      case null #err("Folder not found");
    };
  };

  // Message Functions
  public shared func createMessage(chatId : Nat32, sender : { #user; #ai }, content : Text, referencedVersion : ?Nat32) : async Result.Result<Types.Message, Text> {
    if (content == "") {
      return #err("Content is required");
    };
    let message : Types.Message = {
      id = nextMessageId;
      chatId = chatId;
      sender = sender;
      content = content;
      referencedVersion = referencedVersion;
      createdAt = Time.now();
    };
    messages.put(nextMessageId, message);
    nextMessageId += 1;
    #ok(message);
  };

  public shared func getMessage(id : Nat32) : async Result.Result<?Types.Message, Text> {
    switch (messages.get(id)) {
      case (?message) #ok(?message);
      case null #ok(null);
    };
  };

  public shared query func getAllMessageByChatId(chatId : Nat32) : async Result.Result<[Types.Message], Text> {
    let chatMessages = Iter.toArray(
      Iter.filter(messages.entries(), func ((_, message) : (Nat32, Types.Message)) : Bool { message.chatId == chatId })
    );
    #ok(Array.map(chatMessages, func ((_, message) : (Nat32, Types.Message)) : Types.Message { message }));
  };


  public shared func updateMessage(id : Nat32, content : ?Text) : async Result.Result<Types.Message, Text> {
    switch (messages.get(id)) {
      case (?message) {
        let updatedMessage : Types.Message = {
          id = message.id;
          chatId = message.chatId;
          sender = message.sender;
          content = Option.get(content, message.content);
          referencedVersion = message.referencedVersion;
          createdAt = message.createdAt;
        };
        messages.put(id, updatedMessage);
        #ok(updatedMessage);
      };
      case null #err("Message not found");
    };
  };

  public shared func deleteMessage(id : Nat32) : async Result.Result<(), Text> {
    switch (messages.get(id)) {
      case (?_) {
        messages.delete(id);
        #ok();
      };
      case null #err("Message not found");
    };
  };

  // Project Version Functions
  public shared func createProjectVersion(chatId : Nat32, versionNumber : Nat32, snapshot : Text) : async Result.Result<Types.ProjectVersion, Text> {
    if (snapshot == "") {
      return #err("Snapshot is required");
    };
    let projectVersion : Types.ProjectVersion = {
      id = nextProjectVersionId;
      chatId = chatId;
      versionNumber = versionNumber;
      snapshot = snapshot;
      createdAt = Time.now();
    };
    projectVersions.put(nextProjectVersionId, projectVersion);
    nextProjectVersionId += 1;
    #ok(projectVersion);
  };

  public shared func getProjectVersion(id : Nat32) : async Result.Result<?Types.ProjectVersion, Text> {
    switch (projectVersions.get(id)) {
      case (?projectVersion) #ok(?projectVersion);
      case null #ok(null);
    };
  };

  public shared query func getAllProjectVersionByChatId(chatId : Nat32) : async Result.Result<[Types.ProjectVersion], Text> {
    let chatVersions = Iter.toArray(
      Iter.filter(projectVersions.entries(), func ((_, version) : (Nat32, Types.ProjectVersion)) : Bool { version.chatId == chatId })
    );
    #ok(Array.map(chatVersions, func ((_, version) : (Nat32, Types.ProjectVersion)) : Types.ProjectVersion { version }));
  };
};