import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export const WorkOrderDetailsScreen = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    navigate(`/department/complaints/${id || ''}`, { replace: true });
  }, [id, navigate]);

  return null;
};
