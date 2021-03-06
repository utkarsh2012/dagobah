from setuptools import setup

setup(name='dagobah',
      version='0.2.0',
      description='Simple DAG-based job scheduler',
      url='http://github.com/tthieman/dagobah',
      author='Travis Thieman',
      author_email='travis.thieman@gmail.com',
      license='WTFPL',
      packages=['dagobah',
                'dagobah.backend',
                'dagobah.core',
                'dagobah.daemon',
                'dagobah.email'],
      package_data={'dagobah': ['email/templates/basic/*',
                                'daemon/static/css/*',
                                'daemon/static/js/*',
                                'daemon/static/img/*',
                                'daemon/static/lib/*.js',
                                'daemon/static/lib/Kickstrap1.3.2/Kickstrap/apps/bootstrap/*.js',
                                'daemon/static/lib/Kickstrap1.3.2/Kickstrap/apps/bootstrap/*.ks',
                                'daemon/static/lib/Kickstrap1.3.2/Kickstrap/apps/bootstrap/affix/*',
                                'daemon/static/lib/Kickstrap1.3.2/Kickstrap/apps/bootstrap/alert/*',
                                'daemon/static/lib/Kickstrap1.3.2/Kickstrap/apps/bootstrap/button/*',
                                'daemon/static/lib/Kickstrap1.3.2/Kickstrap/apps/bootstrap/carousel/*',
                                'daemon/static/lib/Kickstrap1.3.2/Kickstrap/apps/bootstrap/collapse/*',
                                'daemon/static/lib/Kickstrap1.3.2/Kickstrap/apps/bootstrap/dropdown/*',
                                'daemon/static/lib/Kickstrap1.3.2/Kickstrap/apps/bootstrap/modal/*',
                                'daemon/static/lib/Kickstrap1.3.2/Kickstrap/apps/bootstrap/popover/*',
                                'daemon/static/lib/Kickstrap1.3.2/Kickstrap/apps/bootstrap/scrollspy/*',
                                'daemon/static/lib/Kickstrap1.3.2/Kickstrap/apps/bootstrap/tab/*',
                                'daemon/static/lib/Kickstrap1.3.2/Kickstrap/apps/bootstrap/tooltip/*',
                                'daemon/static/lib/Kickstrap1.3.2/Kickstrap/apps/bootstrap/transition/*',
                                'daemon/static/lib/Kickstrap1.3.2/Kickstrap/apps/bootstrap/typeahead/*',
                                'daemon/static/lib/Kickstrap1.3.2/Kickstrap/extras/fontawesome/font/*',
                                'daemon/static/lib/Kickstrap1.3.2/Kickstrap/apps/retina/*',
                                'daemon/static/lib/Kickstrap1.3.2/Kickstrap/apps/tinygrowl/*',
                                'daemon/templates/*',
                                'daemon/dagobahd.yml']},
      install_requires=['croniter==0.3.3',
                        'pyyaml==3.10',
                        'flask==0.9',
                        'premailer==1.13',
                        'flask-login==0.2.6',
                        'paramiko==1.11.0'],
      test_suite='nose.collector',
      tests_require=['nose', 'pymongo'],
      entry_points={'console_scripts':
                    ['dagobahd = dagobah.daemon.app:daemon_entrypoint',
                     'echo_dagobah_conf = dagobah.daemon.daemon:print_standard_conf']
                    },
      zip_safe=False)
