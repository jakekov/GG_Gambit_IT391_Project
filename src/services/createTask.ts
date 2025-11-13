import {task_queue} from '@/config/config.js';
import {CloudTasksClient, protos} from '@google-cloud/tasks';

const client = new CloudTasksClient();

export async function createTask(
  date: Date,
  relative_uri: string,
  payload?: string
) {
  if (!task_queue) {
    console.log('yOUSHOULDNT BE CALLING THIS');
    return;
  }
  // TODO(developer): Uncomment these lines and replace with your values.
  const project = task_queue.project;
  const queue = task_queue.queue;
  const location = task_queue.location;

  const parent = client.queuePath(project, location, queue);
  const time = Math.ceil(date.getSeconds() / 30) * 30;
  const task = {
    httpRequest: {
      headers: {
        'Content-Type': 'text/plain', // Set content type to ensure compatibility your application's request parsing
      },
      httpMethod: protos.google.cloud.tasks.v2.HttpMethod.POST,
      url: task_queue.task_run_url + relative_uri,
      body: payload ? Buffer.from(payload).toString('base64') : null,
      name: relative_uri + time.toString(),
    },
    scheduleTime: {seconds: time},
  };

  // if (payload && task.httpRequest) {
  //   task.httpRequest.body = Buffer.from(payload).toString('base64');
  // }

  // task.scheduleTime = {
  //   seconds: time,
  // };

  console.log('Sending task:');
  console.log(task);

  // Send create task request.
  const request = {parent: parent, task: task};
  const [response] = await client.createTask(request);
  const name = response.name;
  console.log(`Created task ${name}`);
}
