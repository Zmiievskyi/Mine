#!/bin/bash
# Gcore Database Management CLI
# Управление настройками PostgreSQL через Gcore API

set -e

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Проверка переменных окружения
if [ -z "$GCORE_API_KEY" ]; then
    echo -e "${RED}Ошибка: GCORE_API_KEY не установлен${NC}"
    echo "Получите API ключ здесь: https://accounts.gcore.com/profile/api-tokens"
    echo "Затем выполните: export GCORE_API_KEY='your-api-key'"
    exit 1
fi

if [ -z "$GCORE_PROJECT_ID" ]; then
    echo -e "${YELLOW}Предупреждение: GCORE_PROJECT_ID не установлен${NC}"
    echo "Установите: export GCORE_PROJECT_ID='your-project-id'"
fi

if [ -z "$GCORE_REGION_ID" ]; then
    echo -e "${YELLOW}Предупреждение: GCORE_REGION_ID не установлен${NC}"
    echo "Установите: export GCORE_REGION_ID='your-region-id'"
fi

# Базовый URL API
API_BASE="https://api.gcore.com/cloud/v1/dbaas/postgres"

# Функция для выполнения API запросов
api_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -z "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: APIKey $GCORE_API_KEY" \
            -H "Content-Type: application/json" \
            "$endpoint"
    else
        curl -s -X "$method" \
            -H "Authorization: APIKey $GCORE_API_KEY" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$endpoint"
    fi
}

# Функция для красивого вывода JSON
pretty_json() {
    python3 -m json.tool 2>/dev/null || cat
}

# Список всех кластеров PostgreSQL
list_clusters() {
    echo -e "${BLUE}Получение списка кластеров PostgreSQL...${NC}"
    api_request "GET" "$API_BASE/clusters/$GCORE_PROJECT_ID/$GCORE_REGION_ID" | pretty_json
}

# Получить информацию о кластере
get_cluster() {
    local cluster_name=$1
    if [ -z "$cluster_name" ]; then
        echo -e "${RED}Ошибка: укажите имя кластера${NC}"
        echo "Использование: $0 get-cluster <cluster-name>"
        exit 1
    fi
    
    echo -e "${BLUE}Получение информации о кластере: $cluster_name${NC}"
    api_request "GET" "$API_BASE/clusters/$GCORE_PROJECT_ID/$GCORE_REGION_ID/$cluster_name" | pretty_json
}

# Обновить настройки кластера
update_cluster() {
    local cluster_name=$1
    local config_file=$2
    
    if [ -z "$cluster_name" ] || [ -z "$config_file" ]; then
        echo -e "${RED}Ошибка: укажите имя кластера и файл конфигурации${NC}"
        echo "Использование: $0 update-cluster <cluster-name> <config.json>"
        exit 1
    fi
    
    if [ ! -f "$config_file" ]; then
        echo -e "${RED}Ошибка: файл $config_file не найден${NC}"
        exit 1
    fi
    
    echo -e "${BLUE}Обновление кластера: $cluster_name${NC}"
    local data=$(cat "$config_file")
    api_request "PATCH" "$API_BASE/clusters/$GCORE_PROJECT_ID/$GCORE_REGION_ID/$cluster_name" "$data" | pretty_json
}

# Регенерировать пароль пользователя
regenerate_password() {
    local cluster_name=$1
    local username=$2
    
    if [ -z "$cluster_name" ] || [ -z "$username" ]; then
        echo -e "${RED}Ошибка: укажите имя кластера и имя пользователя${NC}"
        echo "Использование: $0 regenerate-password <cluster-name> <username>"
        exit 1
    fi
    
    echo -e "${BLUE}Регенерация пароля для пользователя: $username${NC}"
    api_request "POST" "$API_BASE/clusters/$GCORE_PROJECT_ID/$GCORE_REGION_ID/$cluster_name/users/$username/credentials" | pretty_json
}

# Получить метрики кластера
get_metrics() {
    local cluster_name=$1
    
    if [ -z "$cluster_name" ]; then
        echo -e "${RED}Ошибка: укажите имя кластера${NC}"
        echo "Использование: $0 get-metrics <cluster-name>"
        exit 1
    fi
    
    echo -e "${BLUE}Получение метрик кластера: $cluster_name${NC}"
    api_request "GET" "$API_BASE/clusters/$GCORE_PROJECT_ID/$GCORE_REGION_ID/$cluster_name/metrics" | pretty_json
}

# Показать справку
show_help() {
    cat << EOF
${GREEN}Gcore Database Management CLI${NC}

${YELLOW}Использование:${NC}
  $0 <команда> [параметры]

${YELLOW}Команды:${NC}
  list-clusters                    - Список всех кластеров PostgreSQL
  get-cluster <name>               - Информация о кластере
  update-cluster <name> <config>   - Обновить настройки кластера
  regenerate-password <name> <user> - Регенерировать пароль пользователя
  get-metrics <name>               - Получить метрики кластера
  help                             - Показать эту справку

${YELLOW}Переменные окружения:${NC}
  GCORE_API_KEY      - API ключ (обязательно)
                       Получить: https://accounts.gcore.com/profile/api-tokens
  GCORE_PROJECT_ID   - ID проекта
  GCORE_REGION_ID    - ID региона

${YELLOW}Примеры:${NC}
  # Установить переменные окружения
  export GCORE_API_KEY='your-api-key'
  export GCORE_PROJECT_ID='12345'
  export GCORE_REGION_ID='1'

  # Список кластеров
  $0 list-clusters

  # Информация о кластере
  $0 get-cluster my-postgres-cluster

  # Обновить настройки (создайте config.json с нужными параметрами)
  $0 update-cluster my-postgres-cluster config.json

  # Регенерировать пароль
  $0 regenerate-password my-postgres-cluster admin

${YELLOW}Пример config.json для update-cluster:${NC}
{
  "flavor": {
    "cpu": 2,
    "memory_gib": 4
  },
  "storage": {
    "size_gib": 200,
    "type": "ssd-hiiops"
  },
  "pg_server_configuration": {
    "pg_conf": "max_connections = 200\\nshared_buffers = 256MB",
    "version": "14"
  },
  "network": {
    "acl": ["192.168.1.1/32"],
    "network_type": "private"
  }
}

EOF
}

# Главная логика
case "$1" in
    list-clusters)
        list_clusters
        ;;
    get-cluster)
        get_cluster "$2"
        ;;
    update-cluster)
        update_cluster "$2" "$3"
        ;;
    regenerate-password)
        regenerate_password "$2" "$3"
        ;;
    get-metrics)
        get_metrics "$2"
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo -e "${RED}Неизвестная команда: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
