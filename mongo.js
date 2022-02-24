// Just creating a comment file here to remember what do to in case of using mongoDB

/*

creating or switching to db: use <dbName>
creating collection: db.<collectionName>.insertOne()
showing all dbs: show dbs
showing collections: show collections
adding documents to collection: db.<collectionName>.insertMany ( [ {doc1} , {doc2}, {doc3} ] )
  QUERY: 
  finding with a filed: db.<collectionName>.find( { <filedName> : <value> } )
    OPERATOR:
      finding fields with "less than" some value: db.<collectionName>.find ( { <fieldName> : {$lt: value} } )  
      finding fields with "less than || equal" some value: db.<collectionName>.find ( { <fieldName> : {$lte: value} } )  
      finding fields with "greater than || equal" some value: db.<collectionName>.find ( { <fieldName> : {$gte: value} } )  
    AND:
      finding fields with "less than" some value: db.<collectionName>.find ( { <fieldName1> : <value1>, <fieldName2> : <value2>} )  
    OR:
       db.tours.find( {$or: [  {<fieldName1>: <value1>},   {<fieldName2>: <value2>}   ]  })
    PROJECTION:
       db.tours.find( {filtering stuff..}, {<fieldName> : <1> }  )
    UPDATE:
      update one document (if multiple matched the filter,only updates first): db.<collectionName>.updateOne ( {filterObj}, {$set {<FieldName: <newValue> } }  )
      to update multiple: db.<collectionName>.updateMany( {filterObj}, {updateObj}) 
    REPLACE: 
      db.<collectionName>.replaceOne( {filterObj}, {replaceObj})
    DELETE: 
      delete one:  db.<collectionName>.deleteOne({filterObj})
      delete multiple: db.<collectionName>.deleteMany({filterObj})
      delete all: db.<collectionName>.deleteMany({})



    .explain() -> Calling this method on the query returns some analytics results.
    s
*/
