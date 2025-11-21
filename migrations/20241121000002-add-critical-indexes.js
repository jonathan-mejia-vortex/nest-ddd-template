'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Índices críticos para performance
    await queryInterface.addIndex('users', ['authId'], {
      name: 'idx_users_auth_id',
      unique: true,
    });

    await queryInterface.addIndex('auths', ['email'], {
      name: 'idx_auths_email',
      unique: true,
    });

    // Índice para búsquedas por rol
    await queryInterface.addIndex('users', ['role'], {
      name: 'idx_users_role',
    });

    // Índice para timestamps (útil para ordenamiento)
    await queryInterface.addIndex('users', ['createdAt'], {
      name: 'idx_users_created_at',
    });

    await queryInterface.addIndex('auths', ['createdAt'], {
      name: 'idx_auths_created_at',
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeIndex('users', 'idx_users_auth_id');
    await queryInterface.removeIndex('auths', 'idx_auths_email');
    await queryInterface.removeIndex('users', 'idx_users_role');
    await queryInterface.removeIndex('users', 'idx_users_created_at');
    await queryInterface.removeIndex('auths', 'idx_auths_created_at');
  },
};

