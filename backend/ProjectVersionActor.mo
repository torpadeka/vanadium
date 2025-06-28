import HashMap "mo:base/HashMap";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Types "./Types";

actor ProjectVersionActor {
  let projectVersions = HashMap.HashMap<Nat32, Types.ProjectVersion>(0, Nat32.equal, func(x : Nat32) : Nat32 { x });
  var nextProjectVersionId : Nat32 = 0;

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

  public shared func updateProjectVersion(id : Nat32, snapshot : ?Text) : async Result.Result<Types.ProjectVersion, Text> {
    switch (projectVersions.get(id)) {
      case (?projectVersion) {
        let updatedProjectVersion : Types.ProjectVersion = {
          id = projectVersion.id;
          chatId = projectVersion.chatId;
          versionNumber = projectVersion.versionNumber;
          snapshot = Option.get(snapshot, projectVersion.snapshot);
          createdAt = projectVersion.createdAt;
        };
        projectVersions.put(id, updatedProjectVersion);
        #ok(updatedProjectVersion);
      };
      case null #err("ProjectVersion not found");
    };
  };

  public shared func deleteProjectVersion(id : Nat32) : async Result.Result<(), Text> {
    switch (projectVersions.get(id)) {
      case (?_) {
        projectVersions.delete(id);
        #ok();
      };
      case null #err("ProjectVersion not found");
    };
  };
};