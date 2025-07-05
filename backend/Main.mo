// src/backend/Main.mo
import Interfaces "./Interfaces";
import Result "mo:base/Result";
import Principal "mo:base/Principal";

actor Main {
  let userService : Interfaces.UserService = actor ("uxrrr-q7777-77774-qaaaq-cai");
  let chatSystemService : Interfaces.ChatSystemService = actor ("uzt4z-lp777-77774-qaabq-cai");

  public shared ({ caller }) func registerUser(username : Text, email : Text) : async Result.Result<Interfaces.User, Text> {
    await userService.createUser(username, email);
  };

  public shared func getUser(principal : Principal) : async Result.Result<?Interfaces.User, Text> {
    await userService.getUser(principal);
  };

  public shared ({ caller }) func updateUser(username : ?Text, email : ?Text) : async Result.Result<Interfaces.User, Text> {
    await userService.updateUser(username, email);
  };

  public shared ({ caller }) func deleteUser() : async Result.Result<(), Text> {
    await userService.deleteUser();
  };

  public shared ({ caller }) func createChat(title : ?Text) : async Result.Result<Interfaces.Chat, Text> {
    await chatSystemService.createChat(Principal.toText(caller), title);
  };

  public shared func getChat(id : Nat32) : async Result.Result<?Interfaces.Chat, Text> {
    await chatSystemService.getChat(id);
  };

  public shared ({ caller }) func getAllChatByUserId() : async Result.Result<[Interfaces.Chat], Text> {
    await chatSystemService.getAllChatByUserId(Principal.toText(caller));
  };

  public shared func updateChat(id : Nat32, title : ?Text) : async Result.Result<Interfaces.Chat, Text> {
    await chatSystemService.updateChat(id, title);
  };

  public shared func deleteChat(id : Nat32) : async Result.Result<(), Text> {
    await chatSystemService.deleteChat(id);
  };

  public shared func createMessage(chatId : Nat32, sender : { #user; #ai }, content : Text, referencedVersion : ?Nat32) : async Result.Result<Interfaces.Message, Text> {
    await chatSystemService.createMessage(chatId, sender, content, referencedVersion);
  };

  public shared func getMessage(id : Nat32) : async Result.Result<?Interfaces.Message, Text> {
    await chatSystemService.getMessage(id);
  };

  public shared func getAllMessageByChatId(chatId : Nat32) : async Result.Result<[Interfaces.Message], Text> {
    await chatSystemService.getAllMessageByChatId(chatId);
  };

  public shared func updateMessage(id : Nat32, content : ?Text) : async Result.Result<Interfaces.Message, Text> {
    await chatSystemService.updateMessage(id, content);
  };

  public shared func deleteMessage(id : Nat32) : async Result.Result<(), Text> {
    await chatSystemService.deleteMessage(id);
  };

  public shared func createProjectVersion(chatId : Nat32, versionNumber : Nat32, snapshot : Text) : async Result.Result<Interfaces.ProjectVersion, Text> {
    await chatSystemService.createProjectVersion(chatId, versionNumber, snapshot);
  };

  public shared func getProjectVersion(id : Nat32) : async Result.Result<?Interfaces.ProjectVersion, Text> {
    await chatSystemService.getProjectVersion(id);
  };

  public shared func getAllProjectVersionByChatId(chatId : Nat32) : async Result.Result<[Interfaces.ProjectVersion], Text> {
    await chatSystemService.getAllProjectVersionByChatId(chatId);
  };

  public shared func createFile(versionId : Nat32, folderId : ?Nat32, name : Text, content : Text) : async Result.Result<Interfaces.File, Text> {
    await chatSystemService.createFile(versionId, folderId, name, content);
  };

  public shared func getFile(id : Nat32) : async Result.Result<?Interfaces.File, Text> {
    await chatSystemService.getFile(id);
  };

  public shared func getAllFileByProjectVersionId(projectVersionId : Nat32) : async Result.Result<[Interfaces.File], Text> {
    await chatSystemService.getAllFileByProjectVersionId(projectVersionId);
  };

  public shared func updateFile(id : Nat32, folderId : ?Nat32, name : ?Text, content : ?Text) : async Result.Result<Interfaces.File, Text> {
    await chatSystemService.updateFile(id, folderId, name, content);
  };

  public shared func deleteFile(id : Nat32) : async Result.Result<(), Text> {
    await chatSystemService.deleteFile(id);
  };

  public shared func createFolder(versionId : Nat32, name : Text, parentId : ?Nat32) : async Result.Result<Interfaces.Folder, Text> {
    await chatSystemService.createFolder(versionId, name, parentId);
  };

  public shared func getFolder(id : Nat32) : async Result.Result<?Interfaces.Folder, Text> {
    await chatSystemService.getFolder(id);
  };

  public shared func getAllFolderByProjectVersionId(projectVersionId : Nat32) : async Result.Result<[Interfaces.Folder], Text> {
    await chatSystemService.getAllFolderByProjectVersionId(projectVersionId);
  };

  public shared func updateFolder(id : Nat32, name : ?Text, parentId : ?Nat32) : async Result.Result<Interfaces.Folder, Text> {
    await chatSystemService.updateFolder(id, name, parentId);
  };

  public shared func deleteFolder(id : Nat32) : async Result.Result<(), Text> {
    await chatSystemService.deleteFolder(id);
  };
};