CREATE TABLE IF NOT EXISTS Settings (id INTEGER, optName TEXT, optValue TEXT);
INSERT INTO Settings (id, optName, optValue) VALUES (1, 'ROSWS_Url', 'localhost');
INSERT INTO Settings (id, optName, optValue) VALUES (2, 'ROSWS_Port', '9090');
INSERT INTO Settings (id, optName, optValue) VALUES (3, 'ROSWS_Topic_Vel', '/cmd_vel');
INSERT INTO Settings (id, optName, optValue) VALUES (4, 'ROSWS_Topic_Cam', '/usb_cam/image_raw');
INSERT INTO Settings (id, optName, optValue) VALUES (5, 'ROSWS_Topic_Sensor', '/p3dx/laser/scan');
INSERT INTO Settings (id, optName, optValue) VALUES (6, 'ROSWS_Topic_Odom', '/odom');