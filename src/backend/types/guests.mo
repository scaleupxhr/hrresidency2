import Time "mo:core/Time";

module {
  public type GuestId = Nat;

  public type PaymentMethod = {
    #Cash;
    #UPI;
    #Online;
    #Card;
    #Other;
  };

  public type Guest = {
    id : GuestId;
    guestName : Text;
    phoneNumber : Text;
    address : Text;
    idProofType : Text;
    idProofNumber : Text;
    idProofImageUrl : [Text];
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
    paymentMethod : PaymentMethod;
    notes : Text;
    checkedIn : Bool;
    isDeleted : Bool;
    createdAt : Time.Time;
    updatedAt : Time.Time;
  };

  public type GuestInput = {
    guestName : Text;
    phoneNumber : Text;
    address : Text;
    idProofType : Text;
    idProofNumber : Text;
    idProofImageUrl : [Text];
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
    paymentMethod : PaymentMethod;
    notes : Text;
  };

  public type GuestPage = {
    guests : [Guest];
    total : Nat;
    page : Nat;
    totalPages : Nat;
  };

  public type SearchParams = {
    searchTerm : ?Text;
    fromDate : ?Text;
    toDate : ?Text;
    page : Nat;
    limit : Nat;
    includeDeleted : Bool;
  };

  public type ExportFilters = {
    searchTerm : ?Text;
    roomNumber : ?Text;
    dateFrom : ?Text;
    dateTo : ?Text;
  };

  public type PaymentBreakdown = {
    cash : Float;
    upi : Float;
    online : Float;
    card : Float;
    other : Float;
  };

  public type DashboardStats = {
    totalGuests : Nat;
    todayCheckIns : Nat;
    todayCheckOuts : Nat;
    totalRevenue : Float;
    paymentMethodBreakdown : PaymentBreakdown;
  };
};
