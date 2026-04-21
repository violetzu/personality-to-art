.PHONY: up down dev-up dev-down setup logs ps migrate db-export db-restore

-include .env
export

up:
	docker compose up -d --build --remove-orphans

down:
	docker compose down

dev-up:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build

dev-down:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml down

setup:
	@mkdir -p data/images data/postgres data/hf_cache
	@chmod 777 data/images data/hf_cache
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "已建立 .env，請編輯填入正確設定"; \
	else \
		echo ".env 已存在，略過"; \
	fi

db-export:
	@mkdir -p data/backup
	docker compose exec -T postgres pg_dump \
		-U $${POSTGRES_USER:-eq_user} \
		--format=custom --no-acl --no-owner \
		$${POSTGRES_DB:-eq_research} > data/backup/db.dump
	@echo "已匯出：data/backup/db.dump"

# 用法：make db-restore FILE=data/backup/db.dump
db-restore:
	@test -n "$(FILE)" || (echo "請指定 FILE=<路徑>，例如：make db-restore FILE=data/backup/db.dump" && exit 1)
	@test -f "$(FILE)" || (echo "找不到檔案：$(FILE)" && exit 1)
	docker compose exec -T postgres psql -U $${POSTGRES_USER:-eq_user} -c \
		"DROP DATABASE IF EXISTS $${POSTGRES_DB:-eq_research}; CREATE DATABASE $${POSTGRES_DB:-eq_research};"
	docker compose exec -T postgres pg_restore \
		-U $${POSTGRES_USER:-eq_user} \
		-d $${POSTGRES_DB:-eq_research} \
		--no-acl --no-owner --exit-on-error \
		< "$(FILE)"
	@echo "資料庫還原完成"

logs:
	docker compose logs -f nextjs flux

ps:
	docker compose ps
