from dagobah.daemon.daemon import app, login_manager
from dagobah.daemon.auth import *
from dagobah.daemon.api import *
from dagobah.daemon.views import *
import newrelic.agent
from werkzeug.serving import run_simple

newrelic.agent.initialize('newrelic.ini')

def daemon_entrypoint():
    # app.debug = False

    # TODO: the Flask reloader causes multiple Dagobah instances to get created
    # with two schedulers. Need a fix to reenable Flask reloading.

    # print 'Starting app on %s:%s' % (app.config['APP_HOST'],
    #                                  app.config['APP_PORT'])
    # app.run(host=app.config['APP_HOST'], port=app.config['APP_PORT'],
    #         use_reloader=False)
    application = newrelic.agent.wsgi_application()(app)
    run_simple(app.config['APP_HOST'], app.config['APP_PORT'], application, use_reloader=True, use_debugger=True, use_evalex=True)

if __name__ == '__main__':
    daemon_entrypoint()
