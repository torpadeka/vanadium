import HashMap "mo:base/HashMap";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Types "./Types";

actor FolderActor {
  let folders = HashMap.HashMap<Nat32, Types.Folder>(0, Nat32.equal, func(x : Nat32) : Nat32 { x });
  var nextFolderId : Nat32 = 0;

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

  public shared func updateFolder(id : Nat32, name : ?Text) : async Result.Result<Types.Folder, Text> {
    switch (folders.get(id)) {
      case (?folder) {
        let updatedFolder : Types.Folder = {
          id = folder.id;
          versionId = folder.versionId;
          name = Option.get(name, folder.name);
          parentId = folder.parentId;
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
};