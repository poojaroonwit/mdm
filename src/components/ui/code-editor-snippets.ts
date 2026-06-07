export function getCodeSnippets(language: string) {
    const snippets: Array<{ trigger: string, content: string, description: string }> = [
      // Database Operations
      {
        trigger: 'db-create',
        content: `CREATE DATABASE \${1:database_name}
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;`,
        description: 'Create Database'
      },
      {
        trigger: 'db-drop',
        content: `DROP DATABASE IF EXISTS \${1:database_name};`,
        description: 'Drop Database'
      },
      {
        trigger: 'db-backup',
        content: `-- Backup database
mysqldump -u \${1:username} -p \${2:database_name} > \${3:backup_file.sql}`,
        description: 'Database Backup'
      },

      // Data Model Operations
      {
        trigger: 'model-create',
        content: `CREATE TABLE \${1:table_name} (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);`,
        description: 'Create Data Model Table'
      },
      {
        trigger: 'model-alter',
        content: `ALTER TABLE \${1:table_name} 
ADD COLUMN \${2:column_name} \${3:data_type} \${4:constraints};`,
        description: 'Alter Data Model'
      },
      {
        trigger: 'model-index',
        content: `CREATE INDEX idx_\${1:index_name} ON \${2:table_name} (\${3:column_name});`,
        description: 'Create Index'
      },

      // Entity Operations
      {
        trigger: 'entity-select',
        content: `SELECT 
    e.id,
    e.name,
    e.description,
    et.name as entity_type,
    e.created_at
FROM entities e
JOIN entity_types et ON e.entity_type_id = et.id
WHERE e.space_id = \${1:space_id}
ORDER BY e.created_at DESC;`,
        description: 'Select Entities with Type'
      },
      {
        trigger: 'entity-insert',
        content: `INSERT INTO entities (name, description, entity_type_id, space_id, created_by)
VALUES (\${1:'entity_name'}, \${2:'description'}, \${3:entity_type_id}, \${4:space_id}, \${5:user_id});`,
        description: 'Insert Entity'
      },
      {
        trigger: 'entity-update',
        content: `UPDATE entities 
SET name = \${1:'new_name'}, 
    description = \${2:'new_description'},
    updated_at = CURRENT_TIMESTAMP
WHERE id = \${3:entity_id};`,
        description: 'Update Entity'
      },

      // Attribute Operations
      {
        trigger: 'attr-select',
        content: `SELECT 
    a.id,
    a.name,
    a.data_type,
    a.is_required,
    a.default_value,
    av.value as attribute_value
FROM attributes a
LEFT JOIN attribute_values av ON a.id = av.attribute_id
WHERE a.data_model_id = \${1:data_model_id}
ORDER BY a.name;`,
        description: 'Select Attributes with Values'
      },
      {
        trigger: 'attr-insert',
        content: `INSERT INTO attributes (name, data_type, is_required, default_value, data_model_id)
VALUES (\${1:'attribute_name'}, \${2:'VARCHAR'}, \${3:true}, \${4:NULL}, \${5:data_model_id});`,
        description: 'Insert Attribute'
      },

      // Space Operations
      {
        trigger: 'space-select',
        content: `SELECT 
    s.id,
    s.name,
    s.slug,
    s.description,
    COUNT(dm.id) as model_count,
    s.created_at
FROM spaces s
LEFT JOIN data_models dm ON s.id = dm.space_id
WHERE s.id = \${1:space_id}
GROUP BY s.id;`,
        description: 'Select Space with Model Count'
      },
      {
        trigger: 'space-join',
        content: `SELECT 
    s.name as space_name,
    dm.name as model_name,
    COUNT(e.id) as entity_count
FROM spaces s
JOIN data_models dm ON s.id = dm.space_id
LEFT JOIN entities e ON dm.id = e.data_model_id
WHERE s.id = \${1:space_id}
GROUP BY s.id, dm.id;`,
        description: 'Space with Models and Entities'
      },

      // Relationship Operations
      {
        trigger: 'rel-select',
        content: `SELECT 
    r.id,
    r.name,
    r.description,
    e1.name as source_entity,
    e2.name as target_entity,
    r.relationship_type
FROM relationships r
JOIN entities e1 ON r.source_entity_id = e1.id
JOIN entities e2 ON r.target_entity_id = e2.id
WHERE r.data_model_id = \${1:data_model_id};`,
        description: 'Select Relationships'
      },

      // User and Permission Operations
      {
        trigger: 'user-select',
        content: `SELECT 
    u.id,
    u.email,
    u.name,
    ur.role,
    sp.permission_level,
    s.name as space_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN space_permissions sp ON u.id = sp.user_id
LEFT JOIN spaces s ON sp.space_id = s.id
WHERE u.id = \${1:user_id};`,
        description: 'Select User with Roles and Permissions'
      },

      // Analytics Queries
      {
        trigger: 'analytics-models',
        content: `SELECT 
    s.name as space_name,
    COUNT(dm.id) as total_models,
    COUNT(e.id) as total_entities,
    COUNT(a.id) as total_attributes
FROM spaces s
LEFT JOIN data_models dm ON s.id = dm.space_id
LEFT JOIN entities e ON dm.id = e.data_model_id
LEFT JOIN attributes a ON dm.id = a.data_model_id
GROUP BY s.id, s.name
ORDER BY total_models DESC;`,
        description: 'Analytics: Models per Space'
      },
      {
        trigger: 'analytics-usage',
        content: `SELECT 
    DATE(created_at) as date,
    COUNT(*) as entity_count,
    COUNT(DISTINCT data_model_id) as models_used
FROM entities
WHERE created_at >= DATE_SUB(NOW(), INTERVAL \${1:30} DAY)
GROUP BY DATE(created_at)
ORDER BY date DESC;`,
        description: 'Analytics: Usage Over Time'
      }
    ]

    return snippets

}
