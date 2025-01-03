FROM postgres:16

RUN mkdir -p /etc/postgresql/certs && chown postgres:postgres /etc/postgresql/certs

# Copy the SSL certificates into the container
COPY root.crt /etc/postgresql/certs/root.crt
COPY slonik.key /etc/postgresql/certs/server.key
COPY slonik.crt /etc/postgresql/certs/server.crt


RUN chmod 600 /etc/postgresql/certs/server.key && \
    chmod 644 /etc/postgresql/certs/server.crt /etc/postgresql/certs/root.crt && \
    chown postgres:postgres /etc/postgresql/certs/*

RUN echo "ssl = on" >> /usr/share/postgresql/postgresql.conf.sample && \
    echo "ssl_cert_file = '/etc/postgresql/certs/server.crt'" >> /usr/share/postgresql/postgresql.conf.sample && \
    echo "ssl_key_file = '/etc/postgresql/certs/server.key'" >> /usr/share/postgresql/postgresql.conf.sample && \
    echo "ssl_ca_file = '/etc/postgresql/certs/root.crt'" >> /usr/share/postgresql/postgresql.conf.sample

EXPOSE 5432

USER postgres