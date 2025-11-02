import { http, HttpResponse } from 'msw';

// Mock data
import topics from '../data/topics.json';
import mathAddition from '../data/math_addition.json';
import mathSubtraction from '../data/math_subtraction.json';
import scienceElectrical from '../data/science_electrical.json';
import scienceGeneral from '../data/science_general.json';
import usHistory from '../data/us_history.json';
import worldHistory from '../data/world_history.json';

export const handlers = [
  // GET /api/topics and return list of topics
  http.get('/api/topics', () => {
    return HttpResponse.json(topics, { status: 200 });
  }),

  // GET /api/quizes?topicID=<id> and return list of quizzes for topic
  http.get('/api/quizes', ({ request }) => {
    const url = new URL(request.url);
    const topicID = url.searchParams.get('topicID');

    if (!topicID) {
      return HttpResponse.json({ error: 'badtopicID' }, { status: 400 });
    }

    const topic = topics.find((t) => t.id === topicID);
    if (!topic) {
      return HttpResponse.json({ error: 'badtopicID', topicID }, { status: 404 });
    }

    return HttpResponse.json(
      topic.quizzes.map((q) => ({ quizID: q.id, title: q.title })),
      { status: 200 }
    );
  }),

  // GET /api/quiz?quizID=<id> and return quiz questions
  http.get('/api/quiz', ({ request }) => {
    const url = new URL(request.url);
    const quizID = url.searchParams.get('quizID');

    // Map quiz IDs to quiz files, does this change with database?
    const quizzes = {
      math_addition: mathAddition,
      math_subtraction: mathSubtraction,
      science_electrical: scienceElectrical,
      science_general: scienceGeneral,
      us_history: usHistory,
      world_history: worldHistory,
    };

    const quiz = quizzes[quizID];
    if (!quiz)
      return HttpResponse.json({ error: 'badquizID', quizID }, { status: 404 });

    return HttpResponse.json(quiz, { status: 200 });
  }),

  // POST /api/exit, this one seems self explanatory
  http.post('/api/exit', async () => {
    return HttpResponse.json({ exited: true }, { status: 200 });
  }),
];
