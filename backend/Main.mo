import Interfaces "./Interfaces";
import Result "mo:base/Result";

actor Main {
  let userService : Interfaces.UserService = actor("rrkah-fqaaa-aaaaa-aaaaq-cai");
  let chatService : Interfaces.ChatService = actor("ryjl3-tyaaa-aaaaa-aaaba-cai");
  let messageService : Interfaces.MessageService = actor("qzb5j-4qaaa-aaaaa-aaacq-cai");
  let projectVersionService : Interfaces.ProjectVersionService = actor("p3sgq-syaaa-aaaaa-aaadq-cai");
  let fileService : Interfaces.FileService = actor("bd3sg-teaaa-aaaaa-qaada-cai");
  let folderService : Interfaces.FolderService = actor("ryjl3-tyaaa-aaaaa-aaaba-cai");

  public shared func registerUser(username : Text, email : Text) : async Result.Result<Interfaces.User, Text> {
    await userService.createUser(username, email);
  };

  public shared func startChat(userId : Nat32, title : ?Text) : async Result.Result<Interfaces.Chat, Text> {
    await chatService.createChat(userId, title);
  };

  public shared func sendMessage(chatId : Nat32, sender : { #user; #ai }, content : Text, referencedVersion : ?Nat32) : async Result.Result<Interfaces.Message, Text> {
    await messageService.createMessage(chatId, sender, content, referencedVersion);
  };

  public shared func createProjectVersion(chatId : Nat32, versionNumber : Nat32, snapshot : Text) : async Result.Result<Interfaces.ProjectVersion, Text> {
    await projectVersionService.createProjectVersion(chatId, versionNumber, snapshot);
  };

  public shared func createFile(versionId : Nat32, folderId : ?Nat32, name : Text, content : Text) : async Result.Result<Interfaces.File, Text> {
    await fileService.createFile(versionId, folderId, name, content);
  };

  public shared func createFolder(versionId : Nat32, name : Text, parentId : ?Nat32) : async Result.Result<Interfaces.Folder, Text> {
    await folderService.createFolder(versionId, name, parentId);
  };
};