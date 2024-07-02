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