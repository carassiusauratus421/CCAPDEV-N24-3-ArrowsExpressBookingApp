/*
 * Phase 2 safety shim.
 * The Phase 1 demo lifecycle previously used mock-data.json and a fixed demoNow
 * date to mutate localStorage booking statuses. That behavior is intentionally
 * disabled so it cannot impersonate real passenger/admin booking decisions.
 *
 * Expiration, attendance confirmation, completion and seat restoration must
 * be performed by authenticated PHP/MySQL operations, not browser scripts.
 */
(function () {
    "use strict";
    window.arrowsExpressBookingLifecycleLoaded = true;
})();
