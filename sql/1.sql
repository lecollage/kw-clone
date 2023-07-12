delete from user_presence;

insert into user_presence("userId") values (gen_random_uuid());

--

drop table if exists users;

CREATE SEQUENCE users_id_seq;

CREATE TABLE users (
	id uuid NOT NULL DEFAULT uuid_generate_v1(),
	username VARCHAR ( 50 ) UNIQUE NOT NULL,
	email VARCHAR ( 255 ) UNIQUE NOT NULL,
	created_on TIMESTAMP NOT null DEFAULT NOW(),
    last_login TIMESTAMP 
);

ALTER SEQUENCE users_id_seq
OWNED BY users.id;


insert into users("username", "email") values ('test-1', 'test-1@gmail.com');
insert into users("username", "email") values ('test-2', 'test-2@gmail.com');
insert into users("username", "email") values ('test-3', 'test-3@gmail.com');
insert into users("username", "email") values ('test-4', 'test-4@gmail.com');
insert into users("username", "email") values ('test-5', 'test-5@gmail.com');

select * from users;

--

insert into user_presence("userId") values ('79089ece-1ab6-11ee-8864-0ae828a5ab40');
insert into user_presence("userId") values ('7908a946-1ab6-11ee-8864-0ae828a5ab40');
insert into user_presence("userId") values ('7908acd4-1ab6-11ee-8864-0ae828a5ab40');
insert into user_presence("userId") values ('7908afcc-1ab6-11ee-8864-0ae828a5ab40');
insert into user_presence("userId") values ('7908b2f6-1ab6-11ee-8864-0ae828a5ab40');

select * from user_presence;


