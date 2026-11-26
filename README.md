# CCAPDEV-1261-N24-Group3-ArrowsExpressBookingApp
Machine project repository for CCAPDEV-1261

CCSCloud installation guide. (This assumes that Apache, MySQL, and the SSH service are already functional)

1. Log into CCSCloud with your given credentials.

2. Change directory into `/var/www/html`:
```cd /var/www/html```

3. Clone this Git repository and switch to the `phase3` branch:
```
git clone https://github.com/carassiusauratus421/CCAPDEV-N24-3-ArrowsExpressBookingApp
git switch phase3
```

4. Import the database dump into MySQL:
```
$ mysql -u root -p

> CREATE DATABASE IF NOT EXISTS arrows_express;
> USE arrows_express;
> SOURCE /var/www/html/CCAPDEV-N24-3-ArrowsExpressBookingApp/app/db/CCAPDEV-N24-3-ArrowsExpress.sql;
```

5. Edit `app/core/db.php` with the appropriate credentials.


6. Edit `/etc/apache2/apache2.conf` to include the following lines:
```
<Directory /var/www/>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
</Directory>
```
The line `AllowOverride All` allows the use of `.htaccess` files
which restrict access to sensitive web application files.

---

**Web Application User Credentials**

| Email | Password | Role |
|---|---|---|
| admin.primary@dlsu.edu.ph | ArrowsAdminTest26! | Admin |
| roberto.sanjose@gmail.com | ArrowsTest16! | Driver |
| joshua.mendoza@dlsu.edu.ph | ArrowsTest16! | Passenger |