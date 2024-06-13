# Use an official Ruby runtime as a parent image
# docker build -t ${GIT_REPO} .
# docker run -d -p 4000:4000 -v ${ZREPO}:/app --name ${GIT_REPO}-container ${GIT_REPO}
# docker exec -it ${GIT_REPO}-container /bin/bash

FROM ruby:2.7.4
# escape=\
ENV GITHUB_GEM_VERSION 231
ENV JSON_GEM_VERSION 1.8.6
ENV GIT_REPO zer0-mistakes
WORKDIR /app
ADD . /app
RUN gem update --system 3.3.22
RUN bundle update
RUN bundle install
RUN bundle clean --force
EXPOSE 4000
CMD ["bundle", "exec", "jekyll", "serve", "--config", "_config.yml,_config_dev.yml", "--host", "0.0.0.0"]