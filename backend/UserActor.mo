import HashMap "mo:base/HashMap";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Types "./Types";

actor UserActor {
  let users = HashMap.HashMap<Nat32, Types.User>(0, Nat32.equal, func(x : Nat32) : Nat32 { x });
  var nextUserId : Nat32 = 0;

  public shared func createUser(username : Text, email : Text) : async Result.Result<Types.User, Text> {
    if (username == "" or email == "") {
      return #err("Username and email are required");
    };
    let user : Types.User = {
      id = nextUserId;
      username = username;
      email = email;
      createdAt = Time.now();
    };
    users.put(nextUserId, user);
    nextUserId += 1;
    #ok(user);
  };

  public shared func getUser(id : Nat32) : async Result.Result<?Types.User, Text> {
    switch (users.get(id)) {
      case (?user) #ok(?user);
      case null #ok(null);
    };
  };

  public shared func updateUser(id : Nat32, username : ?Text, email : ?Text) : async Result.Result<Types.User, Text> {
    switch (users.get(id)) {
      case (?user) {
        let updatedUser : Types.User = {
          id = user.id;
          username = Option.get(username, user.username);
          email = Option.get(email, user.email);
          createdAt = user.createdAt;
        };
        users.put(id, updatedUser);
        #ok(updatedUser);
      };
      case null #err("User not found");
    };
  };

  public shared func deleteUser(id : Nat32) : async Result.Result<(), Text> {
    switch (users.get(id)) {
      case (?_) {
        users.delete(id);
        #ok();
      };
      case null #err("User not found");
    };
  };
};