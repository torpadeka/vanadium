import HashMap "mo:base/HashMap";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Types "./Types";

actor FileActor {
  let files = HashMap.HashMap<Nat32, Types.File>(0, Nat32.equal, func(x : Nat32) : Nat32 { x });
  var nextFileId : Nat32 = 0;

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

  public shared func updateFile(id : Nat32, content : ?Text) : async Result.Result<Types.File, Text> {
    switch (files.get(id)) {
      case (?file) {
        let updatedFile : Types.File = {
          id = file.id;
          versionId = file.versionId;
          folderId = file.folderId;
          name = file.name;
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
};