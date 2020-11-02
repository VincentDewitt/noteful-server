const foldersService = {
    getAllFolders(knex) {
        return knex.select('*').from('folders')
    },
    getByFolderName(knex, folder_name) {
        return knex.from('folders').select('*').where('folder_name',folder_name).first()
    },
    insertFolder(knex, newFolder){
        return knex
        .insert(newFolder)
        .into('folders')
        .returning('*')
        .then(rows => {
            return rows[0]
        })
    },
    deleteFolder(knex, folder_name) {
        return knex('folders')
            .where({ folder_name })
            .delete()
    },
    updateFolder(knex, id, updatedFolder) {
        return knex('folders')
        .where({ id })
        .update(updatedFolder)
    },
}

module.exports = foldersService