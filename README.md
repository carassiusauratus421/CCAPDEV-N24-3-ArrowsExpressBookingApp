# CCAPDEV-1261-N24-Group3-ArrowsExpressBookingApp
Machine project repository for CCAPDEV-1261

CCSCloud installation guide. (This assumes that Apache, MySQL, and the SSH service are already functional)

1. Log into CCSCloud with your given credentials.

2. Change directory into `/var/www/html`:
```cd /var/www/html```

3. Clone this Git repository and switch to the `phase2` branch:
```
git clone https://github.com/carassiusauratus421/CCAPDEV-N24-3-ArrowsExpressBookingApp
git switch phase2
```

4. Import the database dump into MySQL:
```
$ mysql -u root -p

> CREATE DATABASE IF NOT EXISTS arrows_express;
> USE arrows_express;
> SOURCE /var/www/html/CCAPDEV-N24-3-ArrowsExpressBookingApp/app/db/CCAPDEV-N24-3-ArrowsExpress.sql;
```

5. Edit `app/core/db.php` with the appropriate credentials.
