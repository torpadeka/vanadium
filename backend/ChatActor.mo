import HashMap "mo:base/HashMap";
import Time "mo:base/Time";
import Result "mo:base/Result";
import Nat32 "mo:base/Nat32";
import Types "./Types";

actor ChatActor {
  let chats = HashMap.HashMap<Nat32, Types.Chat>(0, Nat32.equal, func(x : Nat32) : Nat32 { x });
  var nextChatId : Nat32 = 0;

  public shared func createChat(userId : Nat32, title : ?Text) : async Result.Result<Types.Chat, Text> {
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
};