# Use an official Ruby runtime as a parent image
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
CMD ["bundle", "exec", "jekyll", "serve", "--host", "0.0.0.0"]
