import HashMap "mo:base/HashMap";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Nat32 "mo:base/Nat32";
import Option "mo:base/Option";
import Types "./Types";

actor MessageActor {
  let messages = HashMap.HashMap<Nat32, Types.Message>(0, Nat32.equal, func(x : Nat32) : Nat32 { x });
  var nextMessageId : Nat32 = 0;

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

  public shared func updateMessage(id : Nat32, content : ?Text, referencedVersion : ?Nat32) : async Result.Result<Types.Message, Text> {
    switch (messages.get(id)) {
      case (?message) {
        let updatedMessage : Types.Message = {
          id = message.id;
          chatId = message.chatId;
          sender = message.sender;
          content = Option.get(content, message.content);
          referencedVersion = if (referencedVersion != null) {
            referencedVersion 
          } else {
            message.referencedVersion
          };
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
};