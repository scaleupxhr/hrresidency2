import Map "mo:core/Map";
import Types "./types/guests";

module {
  /// Old Guest type — idProofImageUrl was a single Text in the previous version.
  type OldPaymentMethod = {
    #Cash;
    #UPI;
    #Online;
    #Card;
    #Other;
  };

  type OldGuest = {
    id : Nat;
    guestName : Text;
    phoneNumber : Text;
    address : Text;
    idProofType : Text;
    idProofNumber : Text;
    idProofImageUrl : Text;
    checkInDate : Text;
    checkInTime : Text;
    checkOutDate : Text;
    checkOutTime : Text;
    roomNumber : Text;
    roomType : Text;
    numberOfGuests : Nat;
    purposeOfVisit : Text;
    grcNumber : Text;
    invoiceNumber : Text;
    amountPaid : Float;
    paymentMethod : OldPaymentMethod;
    notes : Text;
    checkedIn : Bool;
    isDeleted : Bool;
    createdAt : Int;
    updatedAt : Int;
  };

  type OldActor = {
    guests : Map.Map<Nat, OldGuest>;
    state : { var nextGuestId : Nat };
  };

  type NewActor = {
    guests : Map.Map<Types.GuestId, Types.Guest>;
    state : { var nextGuestId : Nat };
  };

  func migratePaymentMethod(pm : OldPaymentMethod) : Types.PaymentMethod {
    switch pm {
      case (#Cash) #Cash;
      case (#UPI) #UPI;
      case (#Online) #Online;
      case (#Card) #Card;
      case (#Other) #Other;
    }
  };

  public func run(old : OldActor) : NewActor {
    let newGuests = old.guests.map<Nat, OldGuest, Types.Guest>(
      func(_id, g) {
        {
          id = g.id;
          guestName = g.guestName;
          phoneNumber = g.phoneNumber;
          address = g.address;
          idProofType = g.idProofType;
          idProofNumber = g.idProofNumber;
          idProofImageUrl = if (g.idProofImageUrl == "") [] else [g.idProofImageUrl];
          checkInDate = g.checkInDate;
          checkInTime = g.checkInTime;
          checkOutDate = g.checkOutDate;
          checkOutTime = g.checkOutTime;
          roomNumber = g.roomNumber;
          roomType = g.roomType;
          numberOfGuests = g.numberOfGuests;
          purposeOfVisit = g.purposeOfVisit;
          grcNumber = g.grcNumber;
          invoiceNumber = g.invoiceNumber;
          amountPaid = g.amountPaid;
          paymentMethod = migratePaymentMethod(g.paymentMethod);
          notes = g.notes;
          checkedIn = g.checkedIn;
          isDeleted = g.isDeleted;
          createdAt = g.createdAt;
          updatedAt = g.updatedAt;
        }
      }
    );
    { guests = newGuests; state = old.state }
  };
};
