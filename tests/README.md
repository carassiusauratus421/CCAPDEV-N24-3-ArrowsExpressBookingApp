# Unit tests

Automated tests for every function in `app/models/Booking.php`.

| File | Contents |
|---|---|
| `BookingTest.php` | Test source code |
| `test-results.txt` | Output of the latest run |

## How to run

1. Start MySQL in the XAMPP Control Panel.
2. From the project folder, run:

```powershell
C:\xampp\php\php.exe -d date.timezone=Asia/Manila tests\BookingTest.php
```

No extra libraries are needed. The script rewrites `test-results.txt` on every run.

The tests create a temporary `arrows_express_test` database (connecting as `root` with no password, like `app/core/db.php`), take the table definitions from the SQL dump in `app/db/`, and delete it when finished. The real `arrows_express` database is not touched.

`forfeitDueBooking` is private, so it is tested through PHP reflection.
