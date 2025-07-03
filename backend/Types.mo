import Time "mo:base/Time";
import Text "mo:base/Text";
import Principal "mo:base/Principal";

type User = {
  id : Principal.Principal;
  username : Text;
  email : Text;
  createdAt : Time.Time;};

type Chat = {
  id : Nat32;
  userId : Principal.Principal;
  title : ?Text;
  createdAt : Time.Time;
};

type Message = {
  id : Nat32;
  chatId : Nat32;
  sender : { #user; #ai };
  content : Text;
  referencedVersion : ?Nat32;
  createdAt : Time.Time;
};

type ProjectVersion = {
  id : Nat32;
  chatId : Nat32;
  versionNumber : Nat32;
  snapshot : Text;
  createdAt : Time.Time;
};

type File = {
  id : Nat32;
  versionId : Nat32;
  folderId : ?Nat32;
  name : Text;
  content : Text;
  createdAt : Time.Time;
};

type Folder = {
  id : Nat32;
  versionId : Nat32;
  name : Text;
  parentId : ?Nat32;
  createdAt : Time.Time;
};
