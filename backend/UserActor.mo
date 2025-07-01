import HashMap "mo:base/HashMap";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Types "./Types";

actor UserActor {
  let users = HashMap.HashMap<Principal, Types.User>(0, Principal.equal, Principal.hash);
  var nextUserId : Nat32 = 0;

  public shared ({ caller }) func createUser(username : Text, email : Text) : async Result.Result<Types.User, Text> {
    if (username == "" or email == "") {
      return #err("Username and email are required");
    };
    let user : Types.User = {
      id = nextUserId;
      username = username;
      email = email;
      createdAt = Time.now();
    };
    users.put(caller, user); // Store user by caller principal
    #ok(user);
  };

  public query func getUser(principalText : Text) : async Result.Result<?Types.User, Text> {
    let principal = Principal.fromText(principalText);
    switch (users.get(principal)) {
      case (?user) #ok(?user);
      case null #ok(null);
    };
  };

  public shared ({ caller }) func updateUser(username : ?Text, email : ?Text) : async Result.Result<Types.User, Text> {
    switch (users.get(caller)) {
      case (?user) {
        let updatedUser : Types.User = {
          id = user.id;
          username = Option.get(username, user.username);
          email = Option.get(email, user.email);
          createdAt = user.createdAt;
        };
        users.put(caller, updatedUser);
        #ok(updatedUser);
      };
      case null #err("User not found");
    };
  };

  public shared ({ caller }) func deleteUser() : async Result.Result<(), Text> {
    switch (users.get(caller)) {
      case (?_) {
        users.delete(caller);
        #ok();
      };
      case null #err("User not found");
    };
  };
};
