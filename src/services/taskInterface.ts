import {task_queue} from '@/config/config.js';
import {createTask} from './createTask.js';
import {startUpcomingMatchSchedule} from './matchUpdates.js';

interface ScheduleLiveCheck {
  (for_match_id: number, execution_date: Date): Promise<void>;
}
interface ScheduleConclusionCheck {
  (for_match_id: number, execution_date: Date): Promise<void>;
}
export interface PayloadBody {
  for_match_id: number;
  failed_attempts: number;
}
export const schedule_live_check = Create_Live_Check();
function Create_Live_Check(): ScheduleLiveCheck {
  if (task_queue) {
    console.log('Using Google CLoud Tasks');
    return (for_match_id: number, execution_date: Date): Promise<void> => {
      return createTask(
        execution_date,
        '/check_upcoming_to_live',
        JSON.stringify({
          for_match_id: for_match_id,
          failed_attempts: 0,
        } as PayloadBody)
      );
    };
  } else {
    console.log('Using Scheduler');
    return (for_match_id: number, execution_date: Date): Promise<void> => {
      return startUpcomingMatchSchedule(for_match_id, execution_date);
    };
  }
}
export const schedule_conclusion_check = Create_Conclusion_Check();
function Create_Conclusion_Check(): ScheduleConclusionCheck {
  if (task_queue) {
    return (for_match_id: number, execution_date: Date): Promise<void> => {
      return createTask(
        execution_date,
        '/check_for_concluded',
        JSON.stringify({
          for_match_id: for_match_id,
          failed_attempts: 0,
        } as PayloadBody)
      );
    };
  } else {
    return (for_match_id: number, execution_date: Date): Promise<void> => {
      return cancel_conclusion();
    };
  }
}
async function cancel_conclusion() {
  console.log('canceled conclusion');
}
