import Map "mo:core/Map";
import Time "mo:core/Time";
import Types "../types/guests";

module {

  /// Get today's ISO date string (YYYY-MM-DD) from nanosecond timestamp.
  func todayIso() : Text {
    let nowNs : Int = Time.now();
    let nowSec : Int = nowNs / 1_000_000_000;
    let daysSinceEpoch : Int = nowSec / 86400;
    let z : Int = daysSinceEpoch + 719468;
    let era : Int = (if (z >= 0) z else z - 146096) / 146097;
    let doe : Int = z - era * 146097;
    let yoe : Int = (doe - doe / 1460 + doe / 36524 - doe / 146096) / 365;
    let y : Int = yoe + era * 400;
    let doy : Int = doe - (365 * yoe + yoe / 4 - yoe / 100);
    let mp : Int = (5 * doy + 2) / 153;
    let d : Int = doy - (153 * mp + 2) / 5 + 1;
    let m : Int = mp + (if (mp < 10) 3 else -9);
    let year : Int = y + (if (m <= 2) 1 else 0);
    let padTwo = func(n : Int) : Text {
      if (n < 10) "0" # n.toText() else n.toText()
    };
    year.toText() # "-" # padTwo(m) # "-" # padTwo(d)
  };

  /// Create a new Guest record with auto-generated id and current timestamps.
  public func create(
    guests : Map.Map<Types.GuestId, Types.Guest>,
    state : { var nextGuestId : Nat },
    input : Types.GuestInput,
  ) : Types.Guest {
    let id = state.nextGuestId;
    state.nextGuestId += 1;
    let now = Time.now();
    let guest : Types.Guest = {
      id;
      guestName = input.guestName;
      phoneNumber = input.phoneNumber;
      address = input.address;
      idProofType = input.idProofType;
      idProofNumber = input.idProofNumber;
      idProofImageUrl = input.idProofImageUrl;
      checkInDate = input.checkInDate;
      checkInTime = input.checkInTime;
      checkOutDate = input.checkOutDate;
      checkOutTime = input.checkOutTime;
      roomNumber = input.roomNumber;
      roomType = input.roomType;
      numberOfGuests = input.numberOfGuests;
      purposeOfVisit = input.purposeOfVisit;
      grcNumber = input.grcNumber;
      invoiceNumber = input.invoiceNumber;
      amountPaid = input.amountPaid;
      paymentMethod = input.paymentMethod;
      notes = input.notes;
      checkedIn = false;
      isDeleted = false;
      createdAt = now;
      updatedAt = now;
    };
    guests.add(id, guest);
    guest
  };

  /// Update an existing Guest record; returns false if not found.
  public func update(
    guests : Map.Map<Types.GuestId, Types.Guest>,
    id : Types.GuestId,
    input : Types.GuestInput,
  ) : Bool {
    switch (guests.get(id)) {
      case null false;
      case (?existing) {
        let updated : Types.Guest = {
          existing with
          guestName = input.guestName;
          phoneNumber = input.phoneNumber;
          address = input.address;
          idProofType = input.idProofType;
          idProofNumber = input.idProofNumber;
          idProofImageUrl = input.idProofImageUrl;
          checkInDate = input.checkInDate;
          checkInTime = input.checkInTime;
          checkOutDate = input.checkOutDate;
          checkOutTime = input.checkOutTime;
          roomNumber = input.roomNumber;
          roomType = input.roomType;
          numberOfGuests = input.numberOfGuests;
          purposeOfVisit = input.purposeOfVisit;
          grcNumber = input.grcNumber;
          invoiceNumber = input.invoiceNumber;
          amountPaid = input.amountPaid;
          paymentMethod = input.paymentMethod;
          notes = input.notes;
          updatedAt = Time.now();
        };
        guests.add(id, updated);
        true
      };
    }
  };

  /// Soft-delete a Guest (sets isDeleted = true); returns false if not found.
  public func softDelete(
    guests : Map.Map<Types.GuestId, Types.Guest>,
    id : Types.GuestId,
  ) : Bool {
    switch (guests.get(id)) {
      case null false;
      case (?existing) {
        guests.add(id, { existing with isDeleted = true; updatedAt = Time.now() });
        true
      };
    }
  };

  /// Restore a soft-deleted Guest; returns false if not found.
  public func restore(
    guests : Map.Map<Types.GuestId, Types.Guest>,
    id : Types.GuestId,
  ) : Bool {
    switch (guests.get(id)) {
      case null false;
      case (?existing) {
        guests.add(id, { existing with isDeleted = false; updatedAt = Time.now() });
        true
      };
    }
  };

  /// Hard-delete a Guest permanently; returns false if not found.
  public func hardDelete(
    guests : Map.Map<Types.GuestId, Types.Guest>,
    id : Types.GuestId,
  ) : Bool {
    switch (guests.get(id)) {
      case null false;
      case (?_) {
        guests.remove(id);
        true
      };
    }
  };

  /// Toggle checkedIn status; returns new status or null if not found.
  public func toggleCheckIn(
    guests : Map.Map<Types.GuestId, Types.Guest>,
    id : Types.GuestId,
  ) : ?Bool {
    switch (guests.get(id)) {
      case null null;
      case (?existing) {
        let newStatus = not existing.checkedIn;
        guests.add(id, { existing with checkedIn = newStatus; updatedAt = Time.now() });
        ?newStatus
      };
    }
  };

  /// Paginated query with optional search term and date-range filter.
  public func listGuests(
    guests : Map.Map<Types.GuestId, Types.Guest>,
    params : Types.SearchParams,
  ) : Types.GuestPage {
    let lowerSearch : ?Text = switch (params.searchTerm) {
      case null null;
      case (?t) {
        let trimmed = t.trim(#char ' ');
        if (trimmed == "") null else ?(trimmed.toLower())
      };
    };

    // Collect all matching guests into a list
    var matched : [Types.Guest] = [];
    for ((_, g) in guests.entries()) {
      // Filter by deleted status
      let deletedOk = if (params.includeDeleted) g.isDeleted else not g.isDeleted;
      if (deletedOk) {
        // Filter by date range on checkInDate
        let dateOk = switch (params.fromDate, params.toDate) {
          case (?fd, ?td) { g.checkInDate >= fd and g.checkInDate <= td };
          case (?fd, null) { g.checkInDate >= fd };
          case (null, ?td) { g.checkInDate <= td };
          case (null, null) { true };
        };
        if (dateOk) {
          // Filter by search term across Name/Phone/GRC/Invoice
          let searchOk = switch (lowerSearch) {
            case null true;
            case (?term) {
              g.guestName.toLower().contains(#text term) or
              g.phoneNumber.toLower().contains(#text term) or
              g.grcNumber.toLower().contains(#text term) or
              g.invoiceNumber.toLower().contains(#text term)
            };
          };
          if (searchOk) {
            matched := matched.concat([g]);
          };
        };
      };
    };

    let total = matched.size();
    let limit = if (params.limit == 0) 50 else params.limit;
    let page = if (params.page == 0) 1 else params.page;
    let totalPages = if (total == 0) 1 else (total - 1) / limit + 1;
    let startIdx : Int = (page - 1) * limit;
    let endIdx : Int = startIdx + limit;
    let pageGuests = matched.sliceToArray(startIdx, endIdx);

    { guests = pageGuests; total; page; totalPages }
  };

  /// Return all non-deleted guests matching optional export filters (no pagination).
  public func getAllForExport(
    guests : Map.Map<Types.GuestId, Types.Guest>,
    filters : Types.ExportFilters,
  ) : [Types.Guest] {
    let lowerSearch : ?Text = switch (filters.searchTerm) {
      case null null;
      case (?t) {
        let trimmed = t.trim(#char ' ');
        if (trimmed == "") null else ?(trimmed.toLower())
      };
    };
    let lowerRoom : ?Text = switch (filters.roomNumber) {
      case null null;
      case (?r) {
        let trimmed = r.trim(#char ' ');
        if (trimmed == "") null else ?(trimmed.toLower())
      };
    };

    var result : [Types.Guest] = [];
    for ((_, g) in guests.entries()) {
      if (not g.isDeleted) {
        let dateOk = switch (filters.dateFrom, filters.dateTo) {
          case (?fd, ?td) { g.checkInDate >= fd and g.checkInDate <= td };
          case (?fd, null) { g.checkInDate >= fd };
          case (null, ?td) { g.checkInDate <= td };
          case (null, null) { true };
        };
        if (dateOk) {
          let roomOk = switch (lowerRoom) {
            case null true;
            case (?r) { g.roomNumber.toLower().contains(#text r) };
          };
          if (roomOk) {
            let searchOk = switch (lowerSearch) {
              case null true;
              case (?term) {
                g.guestName.toLower().contains(#text term) or
                g.phoneNumber.toLower().contains(#text term) or
                g.grcNumber.toLower().contains(#text term) or
                g.invoiceNumber.toLower().contains(#text term)
              };
            };
            if (searchOk) {
              result := result.concat([g]);
            };
          };
        };
      };
    };
    result
  };

  /// Compute dashboard stats from all guest records.
  public func getDashboardStats(
    guests : Map.Map<Types.GuestId, Types.Guest>,
  ) : Types.DashboardStats {
    let today = todayIso();
    var totalGuests = 0;
    var todayCheckIns = 0;
    var todayCheckOuts = 0;
    var totalRevenue : Float = 0.0;
    var cash : Float = 0.0;
    var upi : Float = 0.0;
    var online : Float = 0.0;
    var card : Float = 0.0;
    var other : Float = 0.0;

    for ((_, g) in guests.entries()) {
      if (not g.isDeleted) {
        if (g.checkedIn) { totalGuests += 1 };
        if (g.checkInDate == today) { todayCheckIns += 1 };
        if (g.checkOutDate == today) { todayCheckOuts += 1 };
        totalRevenue += g.amountPaid;
        switch (g.paymentMethod) {
          case (#Cash) { cash += g.amountPaid };
          case (#UPI) { upi += g.amountPaid };
          case (#Online) { online += g.amountPaid };
          case (#Card) { card += g.amountPaid };
          case (#Other) { other += g.amountPaid };
        };
      };
    };

    {
      totalGuests;
      todayCheckIns;
      todayCheckOuts;
      totalRevenue;
      paymentMethodBreakdown = { cash; upi; online; card; other };
    }
  };

  /// Get a single guest by id.
  public func getGuest(
    guests : Map.Map<Types.GuestId, Types.Guest>,
    id : Types.GuestId,
  ) : ?Types.Guest {
    guests.get(id)
  };
};
