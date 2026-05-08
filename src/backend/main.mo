import Map "mo:core/Map";
import GuestsMixin "mixins/guests-api";
import Types "types/guests";
import Time "mo:core/Time";
import Migration "migration";

(with migration = Migration.run)
actor {
  let guests = Map.empty<Types.GuestId, Types.Guest>();
  let state = { var nextGuestId = 0 };

  include GuestsMixin(guests, state);
};
