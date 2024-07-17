CREATE OR REPLACE FUNCTION block_or_unblock_daySchedule(p_date DATE, p_time_slot VARCHAR(100))
RETURNS VOID AS $$
DECLARE
    current_value VARCHAR(10);
BEGIN
    -- Check if the date already exists in blocked_schedules
    IF EXISTS (SELECT 1 FROM blocked_schedules WHERE schedule_date = p_date) THEN
        -- Get the current value of the specified time slot
            UPDATE blocked_schedules SET time_slot1 = CASE WHEN current_value = '1' THEN '0' ELSE '1' END WHERE schedule_date = p_date;
            UPDATE blocked_schedules SET time_slot2 = CASE WHEN current_value = '1' THEN '0' ELSE '1' END WHERE schedule_date = p_date;
            UPDATE blocked_schedules SET time_slot3 = CASE WHEN current_value = '1' THEN '0' ELSE '1' END WHERE schedule_date = p_date;
            UPDATE blocked_schedules SET time_slot4 = CASE WHEN current_value = '1' THEN '0' ELSE '1' END WHERE schedule_date = p_date;
            UPDATE blocked_schedules SET time_slot5 = CASE WHEN current_value = '1' THEN '0' ELSE '1' END WHERE schedule_date = p_date;
            UPDATE blocked_schedules SET time_slot6 = CASE WHEN current_value = '1' THEN '0' ELSE '1' END WHERE schedule_date = p_date;
            UPDATE blocked_schedules SET time_slot7 = CASE WHEN current_value = '1' THEN '0' ELSE '1' END WHERE schedule_date = p_date;
            UPDATE blocked_schedules SET time_slot8 = CASE WHEN current_value = '1' THEN '0' ELSE '1' END WHERE schedule_date = p_date;
            UPDATE blocked_schedules SET time_slot9 = CASE WHEN current_value = '1' THEN '0' ELSE '1' END WHERE schedule_date = p_date;

        END IF;
    ELSE
        -- Insert a new row with the date and set the specified time slot to 1
        INSERT INTO blocked_schedules (schedule_date, time_slot1, time_slot2, time_slot3, time_slot4, time_slot5, time_slot6, time_slot7, time_slot8, time_slot9)
        VALUES (p_date,'1','1','1','1','1','1','1','1','1');
    END IF;
END;
$$ LANGUAGE plpgsql;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

DELIMITER //

CREATE PROCEDURE block_or_unblock_schedule(
    IN p_date DATE,
    IN p_time_slot VARCHAR(100)
)
BEGIN
    DECLARE current_value VARCHAR(10);

    -- Check if the date already exists in blocked_schedules
    IF EXISTS (SELECT 1 FROM blocked_schedules WHERE schedule_date = p_date) THEN
        -- Get the current value of the specified time slot and update it
        IF p_time_slot = '9:00 AM - 10:00 AM' THEN
            SELECT time_slot1 INTO current_value FROM blocked_schedules WHERE schedule_date = p_date;
            UPDATE blocked_schedules SET time_slot1 = CASE WHEN current_value = '1' THEN '0' ELSE '1' END WHERE schedule_date = p_date;
        ELSEIF p_time_slot = '10:15 AM - 11:15 AM' THEN
            SELECT time_slot2 INTO current_value FROM blocked_schedules WHERE schedule_date = p_date;
            UPDATE blocked_schedules SET time_slot2 = CASE WHEN current_value = '1' THEN '0' ELSE '1' END WHERE schedule_date = p_date;
        ELSEIF p_time_slot = '11:30 AM - 12:30 PM' THEN
            SELECT time_slot3 INTO current_value FROM blocked_schedules WHERE schedule_date = p_date;
            UPDATE blocked_schedules SET time_slot3 = CASE WHEN current_value = '1' THEN '0' ELSE '1' END WHERE schedule_date = p_date;
        ELSEIF p_time_slot = '12:45 PM - 1:45 PM' THEN
            SELECT time_slot4 INTO current_value FROM blocked_schedules WHERE schedule_date = p_date;
            UPDATE blocked_schedules SET time_slot4 = CASE WHEN current_value = '1' THEN '0' ELSE '1' END WHERE schedule_date = p_date;
        ELSEIF p_time_slot = '2:00 PM - 3:00 PM' THEN
            SELECT time_slot5 INTO current_value FROM blocked_schedules WHERE schedule_date = p_date;
            UPDATE blocked_schedules SET time_slot5 = CASE WHEN current_value = '1' THEN '0' ELSE '1' END WHERE schedule_date = p_date;
        ELSEIF p_time_slot = '3:15 PM - 4:15 PM' THEN
            SELECT time_slot6 INTO current_value FROM blocked_schedules WHERE schedule_date = p_date;
            UPDATE blocked_schedules SET time_slot6 = CASE WHEN current_value = '1' THEN '0' ELSE '1' END WHERE schedule_date = p_date;
        ELSEIF p_time_slot = '4:30 PM - 5:30 PM' THEN
            SELECT time_slot7 INTO current_value FROM blocked_schedules WHERE schedule_date = p_date;
            UPDATE blocked_schedules SET time_slot7 = CASE WHEN current_value = '1' THEN '0' ELSE '1' END WHERE schedule_date = p_date;
        ELSEIF p_time_slot = '7:00 PM - 8:00 PM' THEN
            SELECT time_slot8 INTO current_value FROM blocked_schedules WHERE schedule_date = p_date;
            UPDATE blocked_schedules SET time_slot8 = CASE WHEN current_value = '1' THEN '0' ELSE '1' END WHERE schedule_date = p_date;
        ELSEIF p_time_slot = '8:15 PM - 9:15 PM' THEN
            SELECT time_slot9 INTO current_value FROM blocked_schedules WHERE schedule_date = p_date;
            UPDATE blocked_schedules SET time_slot9 = CASE WHEN current_value = '1' THEN '0' ELSE '1' END WHERE schedule_date = p_date;
        END IF;
    ELSE
        -- Insert a new row with the date and set the specified time slot to 1
        INSERT INTO blocked_schedules (schedule_date, time_slot1, time_slot2, time_slot3, time_slot4, time_slot5, time_slot6, time_slot7, time_slot8, time_slot9)
        VALUES (p_date,
                IF(p_time_slot = '9:00 AM - 10:00 AM', '1', '0'),
                IF(p_time_slot = '10:15 AM - 11:15 AM', '1', '0'),
                IF(p_time_slot = '11:30 AM - 12:30 PM', '1', '0'),
                IF(p_time_slot = '12:45 PM - 1:45 PM', '1', '0'),
                IF(p_time_slot = '2:00 PM - 3:00 PM', '1', '0'),
                IF(p_time_slot = '3:15 PM - 4:15 PM', '1', '0'),
                IF(p_time_slot = '4:30 PM - 5:30 PM', '1', '0'),
                IF(p_time_slot = '7:00 PM - 8:00 PM', '1', '0'),
                IF(p_time_slot = '8:15 PM - 9:15 PM', '1', '0'));
    END IF;
END //

DELIMITER ;
