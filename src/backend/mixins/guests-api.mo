import Map "mo:core/Map";
import Types "../types/guests";
import GuestsLib "../lib/guests";

mixin (
  guests : Map.Map<Types.GuestId, Types.Guest>,
  state : { var nextGuestId : Nat },
) {

  /// Add a new guest record.
  public shared func addGuest(input : Types.GuestInput) : async Types.Guest {
    GuestsLib.create(guests, state, input)
  };

  /// Update an existing guest record.
  public shared func updateGuest(id : Types.GuestId, input : Types.GuestInput) : async Bool {
    GuestsLib.update(guests, id, input)
  };

  /// Soft-delete a guest (moves to trash).
  public shared func deleteGuest(id : Types.GuestId) : async Bool {
    GuestsLib.softDelete(guests, id)
  };

  /// Restore a guest from trash.
  public shared func restoreGuest(id : Types.GuestId) : async Bool {
    GuestsLib.restore(guests, id)
  };

  /// Hard-delete a guest permanently.
  public shared func hardDeleteGuest(id : Types.GuestId) : async Bool {
    GuestsLib.hardDelete(guests, id)
  };

  /// Toggle the check-in status of a guest.
  public shared func toggleGuestCheckIn(id : Types.GuestId) : async ?Bool {
    GuestsLib.toggleCheckIn(guests, id)
  };

  /// Paginated guest list with optional search and date-range filter.
  public query func getGuests(params : Types.SearchParams) : async Types.GuestPage {
    GuestsLib.listGuests(guests, params)
  };

  /// Return all non-deleted guests matching optional export filters (no pagination limit).
  public query func getAllGuestsForExport(filters : Types.ExportFilters) : async [Types.Guest] {
    GuestsLib.getAllForExport(guests, filters)
  };

  /// Get a single guest by id.
  public query func getGuest(id : Types.GuestId) : async ?Types.Guest {
    GuestsLib.getGuest(guests, id)
  };

  /// Dashboard statistics.
  public query func getDashboardStats() : async Types.DashboardStats {
    GuestsLib.getDashboardStats(guests)
  };
};
