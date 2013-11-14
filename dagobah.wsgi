#!/usr/bin/python
import sys
sys.path.insert(0,"/PATH/TO/DAGOBAH")

import logging
from dagobah.daemon.daemon import app, login_manager
from dagobah.daemon.auth import *
from dagobah.daemon.api import *
from dagobah.daemon.views import *

logging.basicConfig(stream=sys.stderr)

app.debug = True
application = app